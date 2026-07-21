<script setup lang="ts">
import { nextTick, onMounted, reactive, ref } from 'vue-lynx';
import {
  runOnBackground,
  runOnMainThread,
  useMainThreadRef,
} from 'vue-lynx';

interface BenchRow {
  id: string;
  label: string;
  detail: string;
  height: number;
}

interface DataSourceMetrics {
  logicalItems: number;
  materializedItems: number;
  createdCells: number;
  hydrationCount: number;
  activeCells: number;
  pooledCells: number;
}

interface BenchResult {
  count: number;
  mutations: Record<string, number>;
  metrics?: DataSourceMetrics;
  completed: boolean;
  error?: string;
}

const INITIAL_COUNT = 10_000;
const listRef = useMainThreadRef(null);
const listQueryRef = ref<{ invoke(options: unknown): { exec(): void } }>();
const rows = reactive<BenchRow[]>(
  Array.from({ length: INITIAL_COUNT }, (_, index) => ({
    id: `row-${index}`,
    label: `Row ${index}`,
    detail: `payload-${index % 97}`,
    // LegendList emphasizes dynamic sizes; use five stable size buckets.
    height: 56 + (index % 5) * 12,
  })),
);
const status = ref('Preparing 10,000 logical rows…');
const metricsLine = ref('native cells: waiting');

const result: BenchResult = {
  count: INITIAL_COUNT,
  mutations: {},
  completed: false,
};

function publish(label: string, extra: Record<string, unknown> = {}) {
  const payload = { label, at: Date.now(), ...extra };
  console.log(`[ListDataSourceBench] ${JSON.stringify(payload)}`);
}

function receiveMetrics(metrics: DataSourceMetrics) {
  result.metrics = metrics;
  result.count = rows.length;
  result.completed = true;
  metricsLine.value =
    `logical=${metrics.logicalItems} · created=${metrics.createdCells} · active=${metrics.activeCells} · pooled=${metrics.pooledCells} · hydrations=${metrics.hydrationCount}`;
  status.value = metrics.createdCells < rows.length / 10
    ? 'PASS · native materialization is viewport-bounded'
    : 'FAIL · too many native cells were materialized';
  (globalThis as Record<string, unknown>)[
    '__VUE_LYNX_LIST_BENCH_RESULT__'
  ] = result;
  publish('complete', { result });
}

function receiveError(message: string) {
  result.error = message;
  result.completed = true;
  status.value = `FAIL · ${message}`;
  (globalThis as Record<string, unknown>)[
    '__VUE_LYNX_LIST_BENCH_RESULT__'
  ] = result;
  publish('error', { message });
}

const collectMetricsOnMain = () => {
  'main thread';
  try {
    const getMetrics = (
      globalThis as {
        __vueLynxGetListDataSourceMetrics?: (
          list?: unknown,
        ) => DataSourceMetrics;
      }
    ).__vueLynxGetListDataSourceMetrics;
    if (!getMetrics) throw new Error('ListDataSource metrics hook is missing');
    // This benchmark page owns exactly one list. Aggregate metrics avoid
    // depending on host-specific MainThreadRef wrappers while still exercising
    // the same adapter state used by native callbacks.
    runOnBackground(receiveMetrics)(getMetrics());
  } catch (error) {
    runOnBackground(receiveError)(
      error instanceof Error ? error.message : String(error),
    );
  }
};

function jumpTo(position: number) {
  listQueryRef.value
    ?.invoke({
      method: 'scrollToPosition',
      params: { position, smooth: false },
    })
    .exec();
}

function delay(milliseconds: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, milliseconds));
}

async function runPacedJumps(positions: number[]) {
  for (const position of positions) {
    jumpTo(position);
    // A native list owns the request/enqueue cadence. Yield between jumps so
    // this measures steady-state recycling instead of queueing several full
    // relayouts before native can return off-screen leases.
    await delay(350);
  }
}

async function measureMutation(name: string, mutate: () => void) {
  const started = Date.now();
  mutate();
  await nextTick();
  await nextTick();
  const duration = Date.now() - started;
  result.mutations[name] = duration;
  publish('mutation', { name, duration, count: rows.length });
}

async function runBenchmark() {
  try {
    await nextTick();
    await nextTick();
    publish('ready', { count: rows.length });
    status.value = 'Running rapid jumps and mutation batches…';

    // High-velocity access without overlapping native relayout transactions.
    // The pure-runtime regression separately probes a 0 -> 9,976 window jump;
    // on device, pacing mirrors a user's high-speed scroll while still giving
    // enqueueComponent a chance to return off-screen leases.
    await runPacedJumps([160, 640, 1200, 80]);

    await measureMutation('prepend-250', () => {
      rows.unshift(
        ...Array.from({ length: 250 }, (_, index) => ({
          id: `prepend-${index}`,
          label: `Prepended ${index}`,
          detail: 'bidirectional-feed',
          height: 64 + (index % 4) * 10,
        })),
      );
    });

    await measureMutation('remove-middle-1000', () => {
      rows.splice(4_000, 1_000);
    });

    await measureMutation('rotate-2000', () => {
      const tail = rows.splice(rows.length - 2_000, 2_000);
      rows.unshift(...tail);
    });

    await measureMutation('update-1000', () => {
      for (let index = 0; index < rows.length; index += 10) {
        rows[index]!.label += ' · updated';
      }
    });

    await runPacedJumps([1800, 360, 40]);
    await delay(1200);
    runOnMainThread(collectMetricsOnMain)();
  } catch (error) {
    receiveError(error instanceof Error ? error.message : String(error));
  }
}

onMounted(() => {
  setTimeout(() => void runBenchmark(), 500);
});
</script>

<template>
  <view class="root">
    <view class="header">
      <text class="title">ListDataSource · 10k stress</text>
      <text class="subtitle">
        LegendList-inspired coverage: dynamic sizes, rapid non-local jumps,
        prepend, removal, reorder, and a 1k-field reactive update.
      </text>
      <text class="benchmark-status">{{ status }}</text>
      <text class="benchmark-metrics">{{ metricsLine }}</text>
    </view>

    <list
      ref="listQueryRef"
      class="list"
      list-type="single"
      scroll-orientation="vertical"
      :main-thread-ref="listRef"
      preload-buffer-count="2"
    >
      <list-item
        v-for="row in rows"
        :key="row.id"
        :item-key="row.id"
        :estimated-main-axis-size-px="row.height"
        class="benchmark-row"
        :style="{ height: `${row.height}px` }"
      >
        <view class="benchmark-row-body">
          <text class="benchmark-label">{{ row.label }}</text>
          <text class="benchmark-detail">{{ row.detail }}</text>
        </view>
      </list-item>
    </list>
  </view>
</template>

<style>
.benchmark-status {
  margin-top: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #065f46;
}

.benchmark-metrics {
  margin-top: 4px;
  font-size: 11px;
  color: #475569;
}

.benchmark-row {
  width: 100%;
  padding: 6px 12px;
}

.benchmark-row-body {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 8px 12px;
  background-color: #ffffff;
  border-bottom-width: 1px;
  border-bottom-color: #e2e8f0;
}

.benchmark-label {
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
}

.benchmark-detail {
  margin-top: 3px;
  font-size: 11px;
  color: #64748b;
}
</style>
