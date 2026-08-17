import { ref } from 'vue-lynx';

const globalZIndex = ref(2000);

export function setGlobalZIndex(val: number) {
  globalZIndex.value = val;
}

export function useGlobalZIndex() {
  return globalZIndex;
}
