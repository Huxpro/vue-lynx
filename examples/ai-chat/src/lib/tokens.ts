import type { ColorMode } from '../composables/useColorMode';

/**
 * JS mirror of the CSS variables in App.css. Needed because SVG icons render
 * as images (no currentColor / CSS-var inheritance), so icon colors must be
 * concrete values resolved per theme.
 */
const LIGHT = {
  'default': '#3f3f46',
  toned: '#52525b',
  muted: '#71717a',
  dimmed: '#a1a1aa',
  highlighted: '#18181b',
  inverted: '#ffffff',
  primary: '#2563eb',
  error: '#ef4444',
  success: '#22c55e',
  white: '#ffffff',
} as const;

const DARK: Record<keyof typeof LIGHT, string> = {
  'default': '#e4e4e7',
  toned: '#d4d4d8',
  muted: '#a1a1aa',
  dimmed: '#71717a',
  highlighted: '#ffffff',
  inverted: '#18181b',
  primary: '#60a5fa',
  error: '#f87171',
  success: '#4ade80',
  white: '#ffffff',
};

export type Tone = keyof typeof LIGHT;

export function resolveTone(tone: string, mode: ColorMode): string {
  const palette = mode === 'dark' ? DARK : LIGHT;
  return palette[tone as Tone] ?? tone;
}
