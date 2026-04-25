import type { DefineComponent } from "vue";
import type {IntrinsicElements} from '@lynx-js/types'

type ExtractBindAsOn<T> = {
  [P in keyof T as P extends `bind${infer Rest}` ? `on${Capitalize<Rest>}` : never]: T[P]
}

type NonBindProps<T> = Omit<T, `bind${string}` | 'className'>

type LynxSpecialProps = {
  // kebab-case (source) and camelCase (Volar-normalised) forms are both needed
  'main-thread-ref'?: string;
  'mainThreadRef'?: string;
  [key: `global-bind:${string}`]: ((event: unknown) => void) | undefined;
  [key: `globalBind:${string}`]: ((event: unknown) => void) | undefined;
  [key: `global-catch:${string}`]: ((event: unknown) => void) | undefined;
  [key: `globalCatch:${string}`]: ((event: unknown) => void) | undefined;
  [key: `main-thread:${string}`]: unknown;
  [key: `mainThread:${string}`]: unknown;
}

type VueLynxProps<T> = ExtractBindAsOn<T> & NonBindProps<T> & LynxSpecialProps

type VueLynxComponent<T> = DefineComponent<VueLynxProps<T>>

export type VueLynxElements = {
  [K in keyof IntrinsicElements]: VueLynxComponent<IntrinsicElements[K]>
}

declare module "vue" {
  export interface GlobalComponents extends VueLynxElements {}
}
