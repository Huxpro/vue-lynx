<script setup lang="ts">
import { useOverlay } from '../../composables/useOverlay';
import ModalConfirm from './ModalConfirm.vue';
import ModalRename from './ModalRename.vue';
import Lightbox from './Lightbox.vue';
import ModalShare from './ModalShare.vue';
import SamplePicker from './SamplePicker.vue';
import SearchPalette from './SearchPalette.vue';
import SheetMenu from './SheetMenu.vue';
import UserMenuSheet from './UserMenuSheet.vue';

/**
 * Renders the overlay stack at app root — the stand-in for Nuxt UI's
 * useOverlay() + Reka portals. Overlays are addressed by name because Lynx
 * templates statically resolve components.
 */
const { stack, close } = useOverlay();
</script>

<template>
  <template v-for="overlay in stack" :key="overlay.id">
    <ModalConfirm
      v-if="overlay.name === 'confirm'"
      v-bind="overlay.props"
      @close="(r: unknown) => close(overlay.id, r)"
    />
    <ModalRename
      v-else-if="overlay.name === 'rename'"
      v-bind="overlay.props"
      @close="(r: unknown) => close(overlay.id, r)"
    />
    <SheetMenu
      v-else-if="overlay.name === 'menu'"
      v-bind="overlay.props"
      @close="(r: unknown) => close(overlay.id, r)"
    />
    <ModalShare
      v-else-if="overlay.name === 'share'"
      v-bind="overlay.props"
      @close="(r: unknown) => close(overlay.id, r)"
    />
    <SearchPalette
      v-else-if="overlay.name === 'search'"
      @close="(r: unknown) => close(overlay.id, r)"
    />
    <UserMenuSheet
      v-else-if="overlay.name === 'user-menu'"
      @close="(r: unknown) => close(overlay.id, r)"
    />
    <SamplePicker
      v-else-if="overlay.name === 'sample-picker'"
      @close="(r: unknown) => close(overlay.id, r)"
    />
    <Lightbox
      v-else-if="overlay.name === 'lightbox'"
      v-bind="overlay.props"
      @close="(r: unknown) => close(overlay.id, r)"
    />
  </template>
</template>
