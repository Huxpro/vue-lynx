import type { DefineComponent } from "vue";
import type { InputProps } from '@lynx-js/types'
import type { VueLynxProps } from "../type-utils.js";

declare module "vue" {
  export interface GlobalComponents {
    /**
     * `<input>` is used to create interactive input controls that allow users to input and edit single-line text.
     *
     */
    input: DefineComponent<VueLynxProps<InputProps>>
  }
}
