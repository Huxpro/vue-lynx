import type { DefineComponent } from "vue";
import type { ScrollViewProps } from '@lynx-js/types'
import type { VueLynxProps } from "../type-utils.js";

declare module "vue" {
  export interface GlobalComponents {
    /**
     * Basic scrolling component supporting both horizontal and vertical scrolling.
     * 
     * When its content area is larger than its visible area, it allows users to scroll to reveal more content.
     *
     */
    'scroll-view': DefineComponent<VueLynxProps<ScrollViewProps>>
  }
}
