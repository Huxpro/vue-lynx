import type { DefineComponent } from "vue";
import type { OverlayProps } from '@lynx-js/types'
import type { VueLynxProps } from "../type-utils.js";

declare module "vue" {
  export interface GlobalComponents {
    /**
     * `<overlay>` is a container that does not participate in page layout. It occupies no space itself and requires neither width nor height.
     *
     * When rendered, the content inside <overlay> is completely detached from the Lynx document flow and promoted to a rendering layer outside of Lynx.
    
     * By default, the only child of <overlay> uses the screen dimensions as its width and height. It is recommended to treat it as an independent drawing container for the full overlay content.
     */
    overlay: DefineComponent<VueLynxProps<OverlayProps>>
  }
}
