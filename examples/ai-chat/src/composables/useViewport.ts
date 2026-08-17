import { computed, ref } from 'vue-lynx';

interface SystemInfoLike {
  pixelWidth?: number;
  pixelHeight?: number;
  pixelRatio?: number;
}

// SystemInfo is a Lynx global on both platforms: physical pixels + DPR
// (web-core populates it from screen.availWidth * devicePixelRatio).
const systemInfo = (globalThis as { SystemInfo?: SystemInfoLike }).SystemInfo;

function logicalWidth(): number {
  const pixelWidth = systemInfo?.pixelWidth;
  const ratio = systemInfo?.pixelRatio || 1;
  if (!pixelWidth) return 1024; // assume desktop when undetectable
  return pixelWidth / ratio;
}

const width = ref(logicalWidth());

/**
 * Replaces the original's CSS breakpoints (Tailwind lg:) — Lynx has no
 * viewport media queries, so the layout branches on SystemInfo at startup.
 * (Rotation/resize re-detection is out of scope for the example.)
 */
export function useViewport() {
  const isMobile = computed(() => width.value < 768);
  return { width, isMobile };
}

/** Mobile slide-over sidebar state (original: UDashboardSidebar v-model:open). */
const sidebarOpen = ref(false);

export function useSidebarDrawer() {
  function toggle() {
    sidebarOpen.value = !sidebarOpen.value;
  }
  function close() {
    sidebarOpen.value = false;
  }
  return { sidebarOpen, toggle, close };
}
