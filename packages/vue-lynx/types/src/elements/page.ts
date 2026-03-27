import type { DefineComponent } from "vue";
import type { PageProps } from '@lynx-js/types'
import type { VueLynxProps } from "../type-utils.js";

declare module "vue" {
  export interface GlobalComponents {
    /**
     * `<page>` element is the root node, only one `<page>` element is allowed per page. 
     * 
     * You can omit the explicit `<page>` wrapper, as the frontend framework will generate the root node by default.
     * 
     */
    page: DefineComponent<VueLynxProps<PageProps>>
  }
}
