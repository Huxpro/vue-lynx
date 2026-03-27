import type { DefineComponent } from "vue";
import type { ViewProps } from '@lynx-js/types'
import type { VueLynxProps } from "../type-utils.js";

declare module "vue" {
  export interface GlobalComponents {
    /**
     * A container element similar to HTML's `<div>`. Like `<div>`, `<view>` is a versatile container element that can hold other elements and serves as the foundation for building layouts. 
     * 
     * All attributes, events, and methods available on `<view>` can be used by other elements.
     *
     */
    view: DefineComponent<VueLynxProps<ViewProps>>;
  }
}
