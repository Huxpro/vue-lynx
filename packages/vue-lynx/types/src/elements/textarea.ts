import type { DefineComponent } from "vue";
import type { TextAreaProps } from '@lynx-js/types'
import type { VueLynxProps } from "../type-utils.js";

declare module "vue" {
  export interface GlobalComponents {
    /**
     * `<textarea>` is used to create interactive input controls that allow users to input and edit multi-line text.
     *
     */
    textarea: DefineComponent<VueLynxProps<TextAreaProps>>
  }
}
