import type { DefineComponent } from "vue";
import type { ListItemProps, ListProps, StandardProps } from '@lynx-js/types'
import type { VueLynxProps } from "../type-utils.js";

declare module "vue" {
  export interface GlobalComponents {
    /**
     * The `<list>` component is a high-performance scrollable container that optimizes performance and memory usage through element recycling and lazy loading.
     *
     */
    list: DefineComponent<VueLynxProps<ListProps>>
    
    'list-item': DefineComponent<VueLynxProps<ListItemProps>>

    'list-row': DefineComponent<VueLynxProps<StandardProps>>
  }
}
