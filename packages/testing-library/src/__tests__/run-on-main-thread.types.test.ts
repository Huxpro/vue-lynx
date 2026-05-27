/**
 * Compile-time checks for `runOnMainThread`'s signature.
 *
 * The previous generic constraint (`Fn extends (...args: unknown[]) => R`)
 * rejected every typed worklet body because function-arg positions are
 * contravariant. Consumers had to close over values or cast through
 * `unknown[]`. These assertions pin the looser constraint and the
 * round-trip of Parameters<Fn> / ReturnType<Fn>, so the contract can't
 * silently tighten back.
 *
 * `expectTypeOf` is type-only — these assertions cost nothing at runtime.
 */

import { describe, expectTypeOf, it } from 'vitest';

import { runOnMainThread } from 'vue-lynx';

describe('runOnMainThread (type contract)', () => {
  it('accepts a typed numeric arg and preserves Parameters / ReturnType', () => {
    const fn = runOnMainThread((x: number) => {
      'main thread';
      void x;
    });
    expectTypeOf(fn).parameter(0).toEqualTypeOf<number>();
    expectTypeOf(fn).returns.toEqualTypeOf<Promise<void>>();
  });

  it('accepts a typed object arg — the case that the old signature rejected', () => {
    interface Sample {
      id: number;
      label: string;
    }
    const fn = runOnMainThread((s: Sample) => {
      'main thread';
      void s;
    });
    expectTypeOf(fn).parameter(0).toEqualTypeOf<Sample>();
  });

  it('preserves multi-arg signatures', () => {
    const fn = runOnMainThread((a: number, b: string): boolean => {
      'main thread';
      void a;
      void b;
      return true;
    });
    expectTypeOf(fn).parameters.toEqualTypeOf<[number, string]>();
    expectTypeOf(fn).returns.toEqualTypeOf<Promise<boolean>>();
  });

  it('preserves non-void return types', () => {
    const fn = runOnMainThread((): number => {
      'main thread';
      return 42;
    });
    expectTypeOf(fn).returns.toEqualTypeOf<Promise<number>>();
  });

  it('allows generic worklet bodies', () => {
    function makeRunner<T>(): (v: T) => Promise<void> {
      return runOnMainThread((v: T) => {
        'main thread';
        void v;
      });
    }
    expectTypeOf(makeRunner<string>()).parameter(0).toEqualTypeOf<string>();
  });

  it('rejects non-function first argument', () => {
    // Declared but never invoked — TS still type-checks the body, but the
    // bad call never reaches the runtime side of runOnMainThread.
    const _typeCheckOnly = (): void => {
      // @ts-expect-error first arg must be a function
      runOnMainThread(42);
    };
    void _typeCheckOnly;
  });
});
