// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
//
// Vue Lynx port of upstream `playground/lynx-src/openui/App.tsx`: a
// headless OpenUI preview driven by `globalProps.rawText`, with chunked
// streaming and shell-controlled playback.
import {
  defineComponent,
  h,
  onUnmounted,
  ref,
  watch,
} from 'vue-lynx';
import type { VNodeChild } from 'vue-lynx';

import {
  OpenUiRenderer,
  createOpenUiLibrary,
} from 'vue-lynx-genui/openui';
import type { ActionEvent } from 'vue-lynx-genui/openui';

import { OPENUI_SCENARIOS } from './mockData.js';

const DEFAULT_CHUNK_SIZE = 8;
const DEFAULT_STREAM_DELAY_MS = 30;
const OPENUI_PLAYBACK_CHUNK_SIZE = 240;

type Theme = 'light' | 'dark';

interface GlobalEventEmitter {
  addListener(name: string, listener: (...args: unknown[]) => void): void;
  removeListener(name: string, listener: (...args: unknown[]) => void): void;
}

declare const lynx: {
  __globalProps?: Record<string, unknown>;
  getJSModule(name: 'GlobalEventEmitter'): GlobalEventEmitter;
};

function readGlobalProps(): Record<string, unknown> {
  try {
    return (lynx.__globalProps ?? {}) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function chunkOpenUIResponse(rawText: string): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < rawText.length; i += OPENUI_PLAYBACK_CHUNK_SIZE) {
    chunks.push(rawText.slice(i, i + OPENUI_PLAYBACK_CHUNK_SIZE));
  }
  return chunks;
}

function readTheme(value: unknown): Theme | null {
  if (value === 'light' || value === 'dark') return value;
  if (value === 'Light') return 'light';
  if (value === 'Dark') return 'dark';
  return null;
}

export const App = defineComponent({
  name: 'OpenUIPlaygroundApp',
  setup() {
    const globalProps = readGlobalProps();
    const openUiLibrary = createOpenUiLibrary();

    const openUiToolProvider: Record<
      string,
      (args: Record<string, unknown>) => unknown
    > = {
      get_weather(args) {
        const city = typeof args['city'] === 'string' ? args['city'] : 'Seattle';
        if (city === 'San Francisco') {
          return {
            city,
            temp: 64,
            condition: 'Fog clearing',
            high: 68,
            low: 55,
            humidity: '72%',
            wind: '11 mph',
            updated: 'mocked just now',
            alerts: ['Marine layer expected this evening.'],
          };
        }
        return {
          city: 'Seattle',
          temp: 71,
          condition: 'Partly cloudy',
          high: 76,
          low: 58,
          humidity: '61%',
          wind: '8 mph',
          updated: 'mocked just now',
          alerts: [],
        };
      },
      get_release_queue() {
        return {
          count: 3,
          next: 'Ship OpenUI v0.5 playground cases',
          owner: 'GenUI',
        };
      },
      save_release_note(args) {
        return {
          ok: true,
          id: 'release-note-openui-v05',
          saved: args,
        };
      },
    };

    // Read rawText from globalProps; fall back to hardcoded mock data.
    const rawTextProp = globalProps['rawText'];
    const rawText = typeof rawTextProp === 'string' && rawTextProp.length > 0
      ? rawTextProp
      : OPENUI_SCENARIOS[0]!.raw;

    const instant = globalProps['instant'] === true
      || globalProps['instant'] === '1' || globalProps['instant'] === 1;
    const playbackMode = globalProps['playbackMode'] === true
      || globalProps['playbackMode'] === '1'
      || globalProps['playbackMode'] === 1;
    const theme: Theme = readTheme(globalProps['theme']) ?? 'light';
    const themeClassName = theme === 'dark'
      ? 'openui-page openui-dark luna-dark'
      : 'openui-page openui-light luna-light';

    // Speed multiplier from globalProps (e.g. ?speed=2)
    const speedRaw = globalProps['speed'];
    const speed = typeof speedRaw === 'string'
      ? Number(speedRaw)
      : (typeof speedRaw === 'number' ? speedRaw : 1);
    const streamDelay = !speed || speed <= 0
      ? DEFAULT_STREAM_DELAY_MS
      : DEFAULT_STREAM_DELAY_MS / speed;

    const response = ref('');
    const isStreaming = ref(false);
    const error = ref('');
    const loading = ref(false);
    const playbackTargetCount = ref(0);
    const playbackChunks = chunkOpenUIResponse(rawText);

    const emitter = lynx.getJSModule('GlobalEventEmitter');
    const listeners: Array<[string, (...args: unknown[]) => void]> = [];
    const listen = (name: string, fn: (...args: unknown[]) => void) => {
      emitter.addListener(name, fn);
      listeners.push([name, fn]);
    };

    listen('A2UI_PLAYBACK_PROGRESS', (payload) => {
      if (!playbackMode) return;
      if (!payload || typeof payload !== 'object') return;
      const next = (payload as { deliveredCount?: unknown }).deliveredCount;
      const nextCount = typeof next === 'number'
        ? next
        : (typeof next === 'string' ? Number(next) : Number.NaN);
      if (!Number.isFinite(nextCount) || nextCount < 0) return;
      playbackTargetCount.value = Math.floor(nextCount);
    });

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const startStream = () => {
      loading.value = true;
      isStreaming.value = true;
      error.value = '';
      response.value = '';

      if (instant) {
        response.value = rawText;
        isStreaming.value = false;
        loading.value = false;
        return;
      }

      if (playbackMode) {
        // Playback mode: the shell announces the visible chunk count via
        // `A2UI_PLAYBACK_PROGRESS`; the watcher below slices to match.
        const target = playbackTargetCount.value;
        response.value = playbackChunks.slice(0, target).join('');
        isStreaming.value = target < playbackChunks.length;
        loading.value = false;
        return;
      }

      let offset = 0;
      const tick = () => {
        if (cancelled) return;
        if (offset >= rawText.length) {
          isStreaming.value = false;
          return;
        }

        try {
          const chunk = rawText.slice(offset, offset + DEFAULT_CHUNK_SIZE);
          offset += DEFAULT_CHUNK_SIZE;
          response.value += chunk;
          loading.value = false;
        } catch (e) {
          error.value = String(e);
          isStreaming.value = false;
          loading.value = false;
          return;
        }

        timer = setTimeout(tick, streamDelay);
      };

      tick();
    };

    if (playbackMode) {
      watch(playbackTargetCount, (target) => {
        response.value = playbackChunks.slice(0, target).join('');
        isStreaming.value = target < playbackChunks.length;
        loading.value = false;
      });
    }

    startStream();

    onUnmounted(() => {
      cancelled = true;
      if (timer !== null) clearTimeout(timer);
      for (const [name, fn] of listeners) {
        emitter.removeListener(name, fn);
      }
    });

    const onOpenUiAction = (_event: ActionEvent) => {
      // noop for now
    };

    return (): VNodeChild =>
      h('view', { class: themeClassName }, [
        error.value
          ? h('view', { class: 'openui-feedback' }, [
            h('text', { class: 'openui-error' }, error.value),
          ])
          : null,
        loading.value
          ? h('view', { class: 'openui-feedback' }, [
            h('text', 'Loading...'),
          ])
          : null,
        response.value
          ? h(
            'scroll-view',
            { 'scroll-y': true, class: 'openui-scroll' },
            [
              h(OpenUiRenderer, {
                response: response.value,
                library: openUiLibrary,
                toolProvider: openUiToolProvider,
                onAction: onOpenUiAction,
                isStreaming: isStreaming.value,
              }),
            ],
          )
          : null,
      ]);
  },
});
