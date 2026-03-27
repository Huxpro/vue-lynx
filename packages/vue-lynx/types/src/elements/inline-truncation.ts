import type { DefineComponent } from "vue";
import type { NoProps } from '@lynx-js/types'
import type { VueLynxProps } from "../type-utils.js";

declare module "vue" {
  export interface GlobalComponents {
    /**
     * `<inline-truncation>` tag is used to customize the content that needs to be displayed at the end of the text when truncation occurs.
     */
    'inline-truncation': DefineComponent<VueLynxProps<NoProps>>
  }
}
