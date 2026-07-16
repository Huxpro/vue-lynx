/**
 * Shared ops-stream decoding for the Vapor test suites.
 *
 * `expandOps` additionally expands REGISTER_TEMPLATE / CLONE_TEMPLATE into
 * the granular CREATE/SET/INSERT ops the Main Thread instantiation performs,
 * assigning uids by the same pre-order contract (baseUid + counter). Tests
 * assert against the expanded stream, which keeps assertions readable AND
 * continuously verifies that dynamic ops emitted by the BG thread target
 * exactly the uids the template contract implies.
 */

import { OP, OP_ARITY } from 'vue-lynx/internal/ops';

export interface DecodedOp {
  op: number;
  args: unknown[];
}

/** Decode the flat ops buffer into { op, args } records. */
export function decodeOps(ops: unknown[]): DecodedOp[] {
  const out: DecodedOp[] = [];
  let i = 0;
  while (i < ops.length) {
    const op = ops[i] as number;
    const arity = OP_ARITY[op];
    if (arity === undefined) {
      throw new Error(`Unknown op code ${String(ops[i])} at index ${i}`);
    }
    out.push({ op, args: ops.slice(i + 1, i + 1 + arity) });
    i += 1 + arity;
  }
  return out;
}

export function opsOf(decoded: DecodedOp[], op: number): DecodedOp[] {
  return decoded.filter((entry) => entry.op === op);
}

// --- template expansion -----------------------------------------------------

interface TplProps {
  c?: string;
  s?: Record<string, unknown>;
  a?: Array<[string, string]>;
  i?: string;
  t?: string;
}

type TplNode = [string, TplProps | 0, TplNode[]];

const templates = new Map<number, TplNode>();

/** Clear remembered templates — call from beforeEach. */
export function resetTemplateExpander(): void {
  templates.clear();
}

function expandNode(
  node: TplNode,
  base: number,
  counter: { value: number },
  out: DecodedOp[],
): number | null {
  const uid = base + counter.value++;
  const [tag, props, children] = node;

  // BG-only anchors: the uid is consumed (pre-order contract) but no MT
  // element is created — mirrors instantiateTemplate in ops-apply.ts.
  if (tag === '#comment') return null;
  if (tag === '#text') {
    if (!props || props.t === undefined || props.t === '') return null;
    out.push({ op: OP.CREATE_TEXT, args: [uid] });
    out.push({ op: OP.SET_TEXT, args: [uid, props.t] });
    return uid;
  }

  out.push({ op: OP.CREATE, args: [uid, tag] });
  if (props) {
    if (props.c !== undefined) out.push({ op: OP.SET_CLASS, args: [uid, props.c] });
    if (props.s !== undefined) out.push({ op: OP.SET_STYLE, args: [uid, props.s] });
    if (props.a) {
      for (const [key, value] of props.a) {
        out.push({ op: OP.SET_PROP, args: [uid, key, value] });
      }
    }
    if (props.i !== undefined) out.push({ op: OP.SET_ID, args: [uid, props.i] });
    if (props.t !== undefined) out.push({ op: OP.SET_TEXT, args: [uid, props.t] });
  }
  for (const child of children) {
    const childUid = expandNode(child, base, counter, out);
    if (childUid !== null) {
      out.push({ op: OP.INSERT, args: [uid, childUid, -1] });
    }
  }
  return uid;
}

/**
 * Expand template registration/instantiation ops into the granular ops the
 * Main Thread performs. Non-template ops pass through unchanged.
 */
export function expandOps(decoded: DecodedOp[]): DecodedOp[] {
  const out: DecodedOp[] = [];
  for (const entry of decoded) {
    if (entry.op === OP.REGISTER_TEMPLATE) {
      templates.set(entry.args[0] as number, entry.args[1] as TplNode);
    } else if (entry.op === OP.CLONE_TEMPLATE) {
      const structure = templates.get(entry.args[0] as number);
      if (!structure) {
        throw new Error(
          `CLONE_TEMPLATE for unregistered template ${String(entry.args[0])}`,
        );
      }
      expandNode(structure, entry.args[1] as number, { value: 0 }, out);
    } else {
      out.push(entry);
    }
  }
  return out;
}
