<script setup lang="ts">
import { useOverlay } from '../../composables/useOverlay';
import ModalConfirm from './ModalConfirm.vue';
import ModalRename from './ModalRename.vue';
import SheetMenu from './SheetMenu.vue';

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
  </template>
</template>
