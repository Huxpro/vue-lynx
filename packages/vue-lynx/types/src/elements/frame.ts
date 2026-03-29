import type { DefineComponent } from "vue";
import type { FrameProps } from '@lynx-js/types'
import type { VueLynxProps } from '../type-utils.js'

declare module "vue" {
  export interface GlobalComponents {
    /**
     * A page element similar to HTML's `<iframe>`, which can embed a Lynx page into the current page.
     * 
     */
    frame: DefineComponent<VueLynxProps<FrameProps>>
  }
}
