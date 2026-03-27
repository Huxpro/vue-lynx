import type { DefineComponent } from "vue";
import type { SVGProps } from '@lynx-js/types'
import type { VueLynxProps } from "../type-utils.js";

declare module "vue" {
  export interface GlobalComponents {
    svg: DefineComponent<VueLynxProps<SVGProps>>
  }
}
