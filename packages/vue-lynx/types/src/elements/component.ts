import type { DefineComponent } from "vue";
import type { LynxComponentProps } from '@lynx-js/types'
import type { VueLynxProps } from "../type-utils.js";

declare module "vue" {
  export interface GlobalComponents {
    component: DefineComponent<VueLynxProps<LynxComponentProps>>
  }
}
