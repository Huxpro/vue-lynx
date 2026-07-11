<script setup lang="ts">
import { computed, ref } from 'vue-lynx';

import { useTheme } from '../../../composables/useTheme';
import type { ToolUIPart } from '../../../types/ai';
import Icon from '../../ui/Icon.vue';

/**
 * Port of app/components/chat/tool/Chart.vue. The original renders with
 * nuxt-charts/Unovis (SVG DOM); Lynx has no DOM, so the line chart is
 * generated as an inline SVG string for the native <svg> element. The
 * hover tooltip becomes tap-a-column (PRD F3.9).
 */
const props = defineProps<{
  invocation: ToolUIPart;
}>();

interface ChartOutput {
  title?: string;
  data: Array<Record<string, string | number>>;
  xKey: string;
  series: Array<{ key: string; name: string; color: string }>;
  xLabel?: string;
  yLabel?: string;
}

const { colorMode, toneColor } = useTheme();

const output = computed(() => props.invocation.output as unknown as ChartOutput);

const W = 640;
const H = 300;
const PAD = { top: 16, right: 16, bottom: 40, left: 48 };

const activeIndex = ref<number | null>(null);

const geometry = computed(() => {
  const out = output.value;
  if (!out?.data?.length || !out.series?.length) return null;

  const values = out.data.flatMap((d) => out.series.map((s) => Number(d[s.key] ?? 0)));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const yMin = min - span * 0.1;
  const yMax = max + span * 0.1;

  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const x = (i: number) =>
    PAD.left + (out.data.length === 1 ? innerW / 2 : (i / (out.data.length - 1)) * innerW);
  const y = (v: number) => PAD.top + innerH - ((v - yMin) / (yMax - yMin)) * innerH;

  return { out, x, y, yMin, yMax, innerW, innerH };
});

const svgContent = computed(() => {
  const g = geometry.value;
  if (!g) return '';
  const { out, x, y, yMin, yMax } = g;
  const mutedColor = toneColor('dimmed');
  const gridColor = colorMode.value === 'dark' ? '#3f3f46' : '#e4e4e7';

  const parts: string[] = [];

  // y grid + tick labels (5 ticks)
  const yTicks = 5;
  for (let t = 0; t < yTicks; t++) {
    const v = yMin + ((yMax - yMin) * t) / (yTicks - 1);
    const yy = y(v);
    parts.push(
      `<line x1="${PAD.left}" y1="${yy}" x2="${W - PAD.right}" y2="${yy}" stroke="${gridColor}" stroke-width="1" stroke-dasharray="2,4"/>`,
      `<text x="${PAD.left - 8}" y="${yy + 4}" text-anchor="end" font-size="11" fill="${mutedColor}">${Math.round(v).toLocaleString()}</text>`,
    );
  }

  // x tick labels (max 6 like the original's x-num-ticks)
  const n = out.data.length;
  const step = Math.max(1, Math.ceil(n / 6));
  for (let i = 0; i < n; i += step) {
    parts.push(
      `<text x="${x(i)}" y="${H - PAD.bottom + 20}" text-anchor="middle" font-size="11" fill="${mutedColor}">${String(out.data[i]![out.xKey] ?? '')}</text>`,
    );
  }

  // axis labels
  if (out.xLabel) {
    parts.push(
      `<text x="${PAD.left + g.innerW / 2}" y="${H - 4}" text-anchor="middle" font-size="11" fill="${mutedColor}">${out.xLabel}</text>`,
    );
  }
  if (out.yLabel) {
    parts.push(
      `<text x="12" y="${PAD.top + g.innerH / 2}" text-anchor="middle" font-size="11" fill="${mutedColor}" transform="rotate(-90 12 ${PAD.top + g.innerH / 2})">${out.yLabel}</text>`,
    );
  }

  // series lines + dots (monotone-ish via straight segments)
  for (const serie of out.series) {
    const points = out.data.map((d, i) => `${x(i)},${y(Number(d[serie.key] ?? 0))}`);
    parts.push(
      `<polyline points="${points.join(' ')}" fill="none" stroke="${serie.color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`,
    );
    out.data.forEach((d, i) => {
      parts.push(
        `<circle cx="${x(i)}" cy="${y(Number(d[serie.key] ?? 0))}" r="3" fill="${serie.color}"/>`,
      );
    });
  }

  // active column marker
  if (activeIndex.value !== null && activeIndex.value < n) {
    const xx = x(activeIndex.value);
    parts.push(
      `<line x1="${xx}" y1="${PAD.top}" x2="${xx}" y2="${H - PAD.bottom}" stroke="${mutedColor}" stroke-width="1" stroke-dasharray="3,3"/>`,
    );
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}">${parts.join('')}</svg>`;
});

const active = computed(() => {
  const g = geometry.value;
  if (!g || activeIndex.value === null) return null;
  const row = g.out.data[activeIndex.value];
  if (!row) return null;
  return {
    label: String(row[g.out.xKey] ?? ''),
    values: g.out.series.map((s) => ({
      name: s.name,
      color: s.color,
      value: formatValue(row[s.key]),
    })),
    // tooltip x position as % across the plot area
    leftPct: (activeIndex.value / Math.max(1, g.out.data.length - 1)) * 70 + 8,
  };
});

function formatValue(value: string | number | undefined): string {
  if (value === undefined || value === null) return 'N/A';
  if (typeof value === 'string') return value;
  return Number.isInteger(value)
    ? value.toLocaleString()
    : value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function onColumnTap(index: number) {
  activeIndex.value = activeIndex.value === index ? null : index;
}

const loadingIcon = computed(() => {
  return (
    {
      'input-available': 'i-lucide-line-chart',
      'output-error': 'i-lucide-triangle-alert',
    }[props.invocation.state as string] || 'i-lucide-loader-circle'
  );
});

const loadingMessage = computed(() => {
  return (
    {
      'input-available': 'Generating chart...',
      'output-error': "Can't generate chart, please try again",
    }[props.invocation.state as string] || 'Loading chart data...'
  );
});
</script>

<template>
  <view v-if="invocation.state === 'output-available' && geometry" class="my-2 flex flex-col">
    <view v-if="output.title" class="flex flex-row items-center gap-2 mb-2">
      <Icon name="i-lucide-line-chart" tone="primary" :size="20" />
      <text class="text-lg font-semibold text-highlighted" text-maxline="1">
        {{ output.title }}
      </text>
    </view>

    <!-- legend -->
    <view class="flex flex-row items-center gap-4 mb-1 pl-2">
      <view v-for="serie in output.series" :key="serie.key" class="flex flex-row items-center gap-1.5">
        <view class="legend-dot" :style="{ backgroundColor: serie.color }" />
        <text class="text-xs text-muted">{{ serie.name }}</text>
      </view>
    </view>

    <view class="relative w-full">
      <svg :content="svgContent" class="w-full chart-svg" />

      <!-- tap columns for the tooltip (hover isn't available on Lynx) -->
      <view class="absolute inset-0 flex flex-row">
        <view
          v-for="(_, i) in output.data"
          :key="i"
          class="flex-1 h-full"
          @tap="onColumnTap(i)"
        />
      </view>

      <view
        v-if="active"
        class="absolute top-2 rounded-md bg-default border border-default shadow-lg px-3 py-2 flex flex-col gap-1 z-10"
        :style="{ left: `${active.leftPct}%` }"
      >
        <text class="text-sm font-semibold text-highlighted">{{ active.label }}</text>
        <view
          v-for="v in active.values"
          :key="v.name"
          class="flex flex-row items-center justify-between gap-3"
        >
          <view class="flex flex-row items-center gap-1.5">
            <view class="legend-dot" :style="{ backgroundColor: v.color }" />
            <text class="text-sm text-muted">{{ v.name }}</text>
          </view>
          <text class="text-sm font-semibold text-highlighted">{{ v.value }}</text>
        </view>
      </view>
    </view>
  </view>

  <view v-else class="rounded-xl px-5 py-4 my-2 bg-muted">
    <view class="flex flex-col items-center justify-center chart-loading">
      <Icon
        :name="loadingIcon"
        :tone="invocation.state === 'output-error' ? 'error' : 'muted'"
        :size="32"
        :class="invocation.state === 'input-streaming' ? 'spin' : ''"
      />
      <text
        class="text-sm mt-2"
        :class="invocation.state === 'output-error' ? 'text-error' : 'text-muted'"
      >
        {{ loadingMessage }}
      </text>
    </view>
  </view>
</template>

<style>
.chart-svg {
  aspect-ratio: 2.133;
}
.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 5px;
}
.chart-loading {
  height: 176px;
}
</style>
