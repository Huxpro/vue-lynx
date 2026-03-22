import type { ComponentPublicInstance } from 'vue-lynx';

export interface BarrageItem {
  id: string | number;
  text: string | number;
}

export interface BarrageExpose {
  play(): void;
  pause(): void;
}

export interface BarrageProps {
  modelValue?: BarrageItem[];
  autoPlay?: boolean;
  rows?: number | string;
  top?: number | string;
  duration?: number | string;
  delay?: number;
}

export type BarrageInstance = ComponentPublicInstance<BarrageProps, BarrageExpose>;
