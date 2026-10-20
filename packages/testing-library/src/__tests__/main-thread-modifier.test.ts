/**
 * `.main-thread` template sugar (compile side).
 *
 * `@tap.main-thread` / `@tap.main-thread.catch` / `:ref.main-thread` must
 * compile to the `main-thread-*` props the runtime already reads, and the
 * result must render through the dual-thread pipeline like a hand-written
 * `:main-thread-bindtap`.
 */

import { describe, it, expect } from 'vitest';
import { compile } from '@vue/compiler-dom';
import type { CompilerError } from '@vue/compiler-dom';
import * as VueLynx from 'vue-lynx';
import type { Component } from 'vue-lynx';
import { useMainThreadRef } from 'vue-lynx';
import {
  MAIN_THREAD_MODIFIER_ERROR,
  mainThreadModifierTransform,
} from '../../../vue-lynx/plugin/src/compiler/main-thread-transform.js';
import { elementTemplateTransform } from '../../../vue-lynx/plugin/src/compiler/element-template-transform.js';
import { render } from '../index.js';

function compileTemplate(
  template: string,
  { lowered = false } = {},
): { code: string; errors: CompilerError[] } {
  const errors: CompilerError[] = [];
  const { code } = compile(template, {
    mode: 'module',
    hoistStatic: false,
    cacheHandlers: false,
    whitespace: 'condense',
    isNativeTag: () => true,
    nodeTransforms: lowered
      ? [mainThreadModifierTransform, elementTemplateTransform]
      : [mainThreadModifierTransform],
    onError: (e) => errors.push(e),
  });
  return { code, errors };
}

function toComponent(code: string, state: Record<string, unknown>): Component {
  const body = code
    .replace(
      /import\s*\{([^}]*)\}\s*from\s*"vue"/,
      (_, names: string) => `const {${names.replaceAll(' as ', ': ')}} = Vue`,
    )
    .replace('export function render', 'return function render');
  // eslint-disable-next-line no-new-func
  const renderFn = new Function('Vue', body)(VueLynx);
  return { setup: () => state, render: renderFn } as Component;
}

describe('.main-thread modifier', () => {
  it('rewrites @event.main-thread to the main-thread-bind prop', () => {
    const { code, errors } = compileTemplate(
      '<view @tap.main-thread="onTap" />',
    );
    expect(errors).toEqual([]);
    expect(code).toContain('"main-thread-bindtap": _ctx.onTap');
    expect(code).not.toContain('onTap:');
  });

  it('rewrites @event.main-thread.catch to the main-thread-catch prop', () => {
    const { code, errors } = compileTemplate(
      '<view @touchstart.main-thread.catch="onStart" />',
    );
    expect(errors).toEqual([]);
    expect(code).toContain('"main-thread-catchtouchstart": _ctx.onStart');
  });

  it('rewrites :ref.main-thread to the main-thread-ref prop', () => {
    const { code, errors } = compileTemplate(
      '<view :ref.main-thread="boxRef" />',
    );
    expect(errors).toEqual([]);
    expect(code).toContain('"main-thread-ref": _ctx.boxRef');
    expect(code).not.toContain('ref:');
  });

  it('leaves ordinary bindings alone', () => {
    const { code, errors } = compileTemplate(
      '<view @tap.once="onTap" :ref="plainRef" />',
    );
    expect(errors).toEqual([]);
    expect(code).not.toContain('main-thread');
  });

  it('reports a modifier it cannot honour instead of guessing', () => {
    const { errors } = compileTemplate(
      '<view @tap.main-thread.once="onTap" />',
    );
    expect(errors).toHaveLength(1);
    expect(errors[0]!.code).toBe(MAIN_THREAD_MODIFIER_ERROR);
    expect(errors[0]!.message).toContain('.once');
  });

  it('reports .main-thread on anything but v-on and :ref', () => {
    const { errors } = compileTemplate(
      '<view :style.main-thread="box" />',
    );
    expect(errors).toHaveLength(1);
    expect(errors[0]!.code).toBe(MAIN_THREAD_MODIFIER_ERROR);
  });

  it('renders through the pipeline, with and without element templates', () => {
    const template =
      '<view><view :ref.main-thread="boxRef" @tap.main-thread="onTap"><text>hi</text></view></view>';
    const state = {
      boxRef: useMainThreadRef(null),
      // What the worklet transform leaves in place of the handler: a plain
      // context object, which is what crosses to the main thread.
      onTap: { _wkltId: 'test', _c: {} },
    };
    for (const lowered of [false, true]) {
      const { code, errors } = compileTemplate(template, { lowered });
      expect(errors).toEqual([]);
      const { container } = render(toComponent(code, state));
      expect(container.querySelector('text')!.textContent).toBe('hi');
    }
  });
});
