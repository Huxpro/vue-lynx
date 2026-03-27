import type { DefineComponent } from "vue";
import type { StandardProps, TextProps } from '@lynx-js/types'
import type { VueLynxProps } from "../type-utils.js";

declare module "vue" {
  export interface GlobalComponents {
    /**
     * `<text>` is a built-in element in Lynx used to display text content. 
     * 
     * It supports specifying text style, binding click event callbacks, and can nest `<text>`, `<image>`, and `<view>` elements to achieve relatively complex text and image content presentation.
     *
     */
    text: DefineComponent<VueLynxProps<TextProps>>
    'raw-text': DefineComponent<VueLynxProps<StandardProps & { text: number | string }>>
  }
}
