import type { DefineComponent } from "vue";
import type { ImageProps, FilterImageProps } from '@lynx-js/types'
import type { VueLynxProps } from './../type-utils.js'

declare module "vue" {
  export interface GlobalComponents {
    /**
     * Used to display different types of images, including web images, static resources, and locally stored images.
     * 
     */
    image: DefineComponent<VueLynxProps<ImageProps>>
    'filter-image': DefineComponent<VueLynxProps<FilterImageProps>>
    'inline-image': DefineComponent<VueLynxProps<ImageProps>>
  }
}
