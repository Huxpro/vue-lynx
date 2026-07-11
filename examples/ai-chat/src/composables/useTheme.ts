import { computed, ref, watch } from 'vue-lynx';

function mix(a: string, b: string, t = 0.5): string {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  const c = pa.map((v, i) => Math.round(v + (pb[i]! - v) * t));
  return `#${c.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

import { NEUTRAL_SCALES, PRIMARY_HUES } from '../lib/palette';
import { getItem, setItem } from '../lib/storage';
import { useColorMode } from './useColorMode';

/**
 * Runtime theme engine replacing Nuxt UI's app.config theming: the UserMenu
 * theme picker mutates `primary` / `neutral`, and every --ui-* token is
 * recomputed and applied as inline CSS variables on the app root
 * (enableCSSInlineVariables + enableCSSInheritance make them cascade).
 */
const primary = ref(getItem('ai-chat:primary') || 'blue');
const neutral = ref(getItem('ai-chat:neutral') || 'zinc');

watch(primary, (v) => setItem('ai-chat:primary', v));
watch(neutral, (v) => setItem('ai-chat:neutral', v));

export function useTheme() {
  const { colorMode, toggle } = useColorMode();

  const tokens = computed<Record<string, string>>(() => {
    const dark = colorMode.value === 'dark';
    const scale = NEUTRAL_SCALES[neutral.value] ?? NEUTRAL_SCALES.zinc!;
    const hue = PRIMARY_HUES[primary.value] ?? PRIMARY_HUES.blue!;

    return dark
      ? {
          'default': scale['200']!,
          toned: scale['300']!,
          muted: scale['400']!,
          dimmed: scale['500']!,
          highlighted: '#ffffff',
          inverted: scale['900']!,
          primary: hue.dark,
          error: '#f87171',
          success: '#4ade80',
          white: '#ffffff',
          bg: scale['900']!,
          bgPage: scale['950']!,
          bgMuted: scale['800']!,
          bgElevated: scale['800']!,
          bgAccented: scale['700']!,
          bgInverted: '#ffffff',
          border: scale['800']!,
          borderMuted: scale['700']!,
          borderAccented: scale['700']!,
          bgSidebar: scale['950']!,
        }
      : {
          'default': scale['700']!,
          toned: scale['600']!,
          muted: scale['500']!,
          dimmed: scale['400']!,
          highlighted: scale['900']!,
          inverted: '#ffffff',
          primary: hue.light,
          error: '#ef4444',
          success: '#22c55e',
          white: '#ffffff',
          bg: '#ffffff',
          bgPage: scale['50']!,
          bgMuted: scale['50']!,
          bgElevated: scale['100']!,
          bgAccented: scale['200']!,
          bgInverted: scale['900']!,
          border: scale['200']!,
          borderMuted: scale['200']!,
          borderAccented: scale['300']!,
          bgSidebar: scale['50']!,
        };
  });

  /** inline CSS vars applied on the app root (overrides App.css defaults) */
  const rootStyle = computed<Record<string, string>>(() => {
    const t = tokens.value;
    return {
      '--ui-primary': t.primary!,
      '--ui-error': t.error!,
      '--ui-success': t.success!,
      '--ui-text-dimmed': t.dimmed!,
      '--ui-text-muted': t.muted!,
      '--ui-text-toned': t.toned!,
      '--ui-text': t['default']!,
      '--ui-text-highlighted': t.highlighted!,
      '--ui-text-inverted': t.inverted!,
      '--ui-bg-page': t.bgPage!,
      '--ui-bg': t.bg!,
      '--ui-bg-muted': t.bgMuted!,
      '--ui-bg-elevated': t.bgElevated!,
      '--ui-bg-accented': t.bgAccented!,
      '--ui-bg-inverted': t.bgInverted!,
      '--ui-border': t.border!,
      '--ui-border-muted': t.borderMuted!,
      '--ui-border-accented': t.borderAccented!,
      '--ui-bg-sidebar': t.bgSidebar!,
      '--ui-bg-elevated-half': mix(t.bg!, t.bgElevated!),
    };
  });

  /** resolve a semantic tone (or literal color) to a concrete value — for SVG icons */
  function toneColor(tone: string): string {
    return tokens.value[tone] ?? tone;
  }

  return { colorMode, toggle, primary, neutral, tokens, rootStyle, toneColor };
}
