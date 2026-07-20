<script setup lang="ts">
import { ref } from 'vue-lynx';
import {
  runOnBackground,
  runOnMainThread,
  useMainThreadRef,
} from 'vue-lynx';
import { makeCards } from '../shared/data';

/**
 * List cell recycling probe (#302).
 *
 * Tap "Run recycle probe" — BG handler schedules a main-thread function that
 * calls the list's componentAtIndex / enqueueComponent and reports whether
 * uiSigns self-reuse and cross-item-reuse.
 */
type ProbeResult = {
  selfOk: boolean;
  crossOk: boolean;
  sign0: number;
  sign0b: number;
  sign1: number;
  poolAfterLeave: number;
  poolAfterCross: number;
  reuseKey: string;
};

const cards = makeCards(40, 'Cell');
const listRef = useMainThreadRef(null);
const status = ref('Tap “Run recycle probe” to verify enqueue / reuse.');
const selfLine = ref('self-reuse: —');
const crossLine = ref('cross-item: —');
const detailLine = ref('');
const passed = ref<boolean | null>(null);

function reportProbe(result: ProbeResult) {
  const selfOk = result.selfOk;
  const crossOk = result.crossOk;
  passed.value = selfOk && crossOk;
  selfLine.value = selfOk
    ? `self-reuse: PASS (sign ${result.sign0} → ${result.sign0b})`
    : `self-reuse: FAIL (sign ${result.sign0} → ${result.sign0b})`;
  crossLine.value = crossOk
    ? `cross-item: PASS (pooled ${result.sign0b} → index1 ${result.sign1})`
    : `cross-item: FAIL (pooled ${result.sign0b} → index1 ${result.sign1})`;
  detailLine.value =
    `pool after leave=${result.poolAfterLeave} · after cross=${result.poolAfterCross} · key=${result.reuseKey}`;
  status.value = passed.value
    ? 'Recycle probe passed — framework pool is live.'
    : 'Recycle probe failed — check MT enqueueComponent / hydrate.';
}

function reportProbeError(message: string) {
  passed.value = false;
  status.value = `Probe error: ${message}`;
  selfLine.value = 'self-reuse: FAIL';
  crossLine.value = 'cross-item: FAIL';
  detailLine.value = message;
}

const runProbeOnMain = () => {
  'main thread';
  const list = (listRef as unknown as { current?: unknown }).current;
  try {
    const probe = (
      globalThis as {
        __vueLynxProbeListRecycle?: (el?: unknown) => ProbeResult;
      }
    ).__vueLynxProbeListRecycle;
    if (typeof probe !== 'function') {
      runOnBackground(reportProbeError)('__vueLynxProbeListRecycle missing');
      return;
    }
    // Pass listRef when available; probe falls back to the registered <list>.
    const result = probe(list ?? undefined);
    runOnBackground(reportProbe)(result);
  } catch (err) {
    runOnBackground(reportProbeError)(
      err instanceof Error ? err.message : String(err),
    );
  }
};

function onTapProbe() {
  runOnMainThread(runProbeOnMain)();
}
</script>

<template>
  <view class="root">
    <view class="header">
      <text class="title">list · cell recycle</text>
      <text class="subtitle">
        Framework-side enqueueComponent pool (#302). Probe leave→re-enter
        (same uiSign) and leave→other index (cross-item hydrate).
      </text>
    </view>

    <view class="toolbar">
      <view class="btn danger" @tap="onTapProbe">
        <text class="btn-text">Run recycle probe</text>
      </view>
    </view>

    <view
      class="banner"
      :class="passed === true ? 'ok-banner' : passed === false ? 'warn' : ''"
    >
      <text
        class="banner-text"
        :class="passed === true ? 'ok-text' : ''"
      >
        {{ status }}
      </text>
      <text class="banner-text">{{ selfLine }}</text>
      <text class="banner-text">{{ crossLine }}</text>
      <text class="banner-text">{{ detailLine }}</text>
    </view>

    <list
      class="list"
      list-type="single"
      scroll-orientation="vertical"
      :main-thread-ref="listRef"
    >
      <list-item
        v-for="card in cards"
        :key="card.id"
        :item-key="card.id"
        reuse-identifier="row"
        :estimated-main-axis-size-px="88"
      >
        <view class="card">
          <text class="card-title">{{ card.title }}</text>
          <text class="card-body">{{ card.body }}</text>
        </view>
      </list-item>
    </list>
  </view>
</template>
