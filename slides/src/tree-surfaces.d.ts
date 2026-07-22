/**
 * Tree surfaces — expressiveness sketch for the VueConf deck.
 *
 * Left:  ShadowElement — real BG node (VDOM & Vapor share it;
 *        Vapor's host surface is a subset of VDOM's nodeOps).
 * Right: AddressableNode — conceptual MT dense/named slot (Vapor).
 *
 * Anchors:
 *   ShadowElement → runtime/src/shadow-element.ts
 *   nodeOps       → runtime/src/node-ops.ts
 *   vapor imports → compiled SFC / @vue/runtime-vapor via 'vue'
 */

// ---------------------------------------------------------------------------
// VDOM & Vapor · ShadowElement (real)
// ---------------------------------------------------------------------------

/** packages/vue-lynx/runtime/src/shadow-element.ts */
export declare class ShadowElement {
  id: number;
  type: string;
  parent: ShadowElement | null;
  firstChild: ShadowElement | null;
  lastChild: ShadowElement | null;
  prev: ShadowElement | null;
  next: ShadowElement | null;

  _textValue: string;
  _style: Record<string, unknown>;
  _baseClass: string;

  insertBefore(child: ShadowElement, anchor: ShadowElement | null): void;
  removeChild(child: ShadowElement): void;
}

/**
 * Host surface on the same ShadowElement — checklist:
 *
 *   shared data: ShadowElement { id · type · parent · firstChild · next }
 *
 *                VDOM   Vapor
 *   createElement  ●      —
 *   insert/remove  ●      —
 *   parent/next    ●      —
 *   patchProp      ●      —
 *   setText        ●      ●
 *   template       —      ●
 *   child          —      ●
 *   on             —      ●
 */

// ---------------------------------------------------------------------------
// Vapor · AddressableNode (conceptual — MT dense names)
// ---------------------------------------------------------------------------

/** @conceptual — talk sketch; not a type in packages/ today. */
export interface AddressableNode {
  /** uid = base + preorder slot */
  readonly uid: number;
  readonly tag: string;
}

export {};
