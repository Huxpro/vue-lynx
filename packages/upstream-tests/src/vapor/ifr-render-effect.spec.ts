/**
 * IFR main-thread renderEffect is one-shot (no reactive wiring), and
 * template() accepts build-time structured TemplateNode literals.
 */

import { beforeEach, describe, expect, it } from 'vitest';

import { IFR_MT_FLAG_GLOBAL } from 'vue-lynx/internal/ops';
import { resetForTesting } from 'vue-lynx';
import {
  ref,
  renderEffect,
  template,
} from 'vue-lynx/vapor';

describe('IFR renderEffect one-shot', () => {
  beforeEach(() => {
    resetForTesting();
    delete (globalThis as Record<string, unknown>)[IFR_MT_FLAG_GLOBAL];
  });

  it('evaluates bindings once on the IFR main thread without re-tracking', () => {
    (globalThis as Record<string, unknown>)[IFR_MT_FLAG_GLOBAL] = true;

    const title = ref('Hello');
    const reads: string[] = [];

    renderEffect(() => {
      reads.push(title.value);
    });

    expect(reads).toEqual(['Hello']);
    // Mutating the ref must NOT re-fire — no RenderEffect was wired.
    title.value = 'World';
    expect(reads).toEqual(['Hello']);
  });

  it('keeps normal reactive wiring off the IFR main thread', async () => {
    const title = ref('Hello');
    const reads: string[] = [];

    renderEffect(() => {
      reads.push(title.value);
    });

    expect(reads).toEqual(['Hello']);
    title.value = 'World';
    // Allow the real RenderEffect to flush.
    await Promise.resolve();
    await Promise.resolve();
    expect(reads).toContain('World');
  });
});

describe('structured template()', () => {
  beforeEach(() => {
    resetForTesting();
    delete (globalThis as Record<string, unknown>)[IFR_MT_FLAG_GLOBAL];
  });

  it('clones from a TemplateNode without HTML parsing', () => {
    const factory = template(
      ['view', { c: 'card' }, [['text', { t: 'hi' }, []]]] as never,
      1,
    );
    const root = factory();
    expect(root.tag).toBe('view');
    expect(root._baseClass).toBe('card');
    // Folded only-child text: element host + aliased #text shadow node.
    const textHost = root.firstChild!;
    expect(textHost.tag).toBe('text');
    expect(textHost.firstChild!.tag).toBe('#text');
    expect(textHost.firstChild!._text).toBe('hi');
    // Second clone shares the inert proto (same contract as string form).
    const root2 = factory();
    expect(root2).not.toBe(root);
    expect(root2._baseClass).toBe('card');
  });
});
