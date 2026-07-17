import type { IntrinsicElements } from '@lynx-js/types';
import type { VueLynxProps } from '../src/elements/index.js';

type ViewProps = VueLynxProps<IntrinsicElements['view']>;

const mainThreadRef = {
  _wvid: 1,
  toJSON: () => ({ _wvid: 1, _initValue: null }),
};

const onTap = () => undefined;

const validSpecialProps = {
  class: ['container', { active: true }],
  'main-thread-ref': mainThreadRef,
  mainThreadRef: mainThreadRef,
  'main-thread-bindtap': onTap,
  mainThreadBindtap: onTap,
  'global-bindtap': onTap,
  globalBindtap: onTap,
  'global-catchtap': onTap,
  globalCatchtap: onTap,
} satisfies ViewProps;

void validSpecialProps;

// @ts-expect-error main-thread-ref expects a MainThreadRef-like object, not a string.
const invalidMainThreadRef = { 'main-thread-ref': 'ref-id' } satisfies ViewProps;

// @ts-expect-error Vue Lynx runtime uses main-thread-* props, not main-thread:*.
const invalidMainThreadNamespace = { 'main-thread:bindtap': onTap } satisfies ViewProps;

// @ts-expect-error Vue Lynx runtime uses global-bind* props, not global-bind:*.
const invalidGlobalNamespace = { 'global-bind:tap': onTap } satisfies ViewProps;

void invalidMainThreadRef;
void invalidMainThreadNamespace;
void invalidGlobalNamespace;
