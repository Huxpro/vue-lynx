// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
//
// Vue Lynx port of upstream `playground/lynx-src/openui/App.tsx`, extended
// with a self-contained scenario picker.
import {
  computed,
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

type Theme = 'light' | 'dark';

declare const lynx: {
  __globalProps?: Record<string, unknown>;
};

function readGlobalProps(): Record<string, unknown> {
  try {
    return (lynx.__globalProps ?? {}) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function readTheme(value: unknown): Theme | null {
  if (value === 'light' || value === 'dark') return value;
  if (value === 'Light') return 'light';
  if (value === 'Dark') return 'dark';
  return null;
}

export const App = defineComponent({
  name: 'OpenUIDemoApp',
  setup() {
    const globalProps = readGlobalProps();
    const openUiLibrary = createOpenUiLibrary();

    const openUiToolProvider: Record<
      string,
      (args: Record<string, unknown>) => unknown
    > = {
      get_weather(args) {
        const city = typeof args['city'] === 'string'
          ? args['city']
          : 'Seattle';
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

    const initialScenarioId = typeof globalProps['scenario'] === 'string'
      ? globalProps['scenario']
      : OPENUI_SCENARIOS[0]!.id;
    const selectedScenarioId = ref(initialScenarioId);

    // Inline rawText from globalProps wins over the picked scenario
    // (parity with the upstream globalProps contract).
    const globalRawText = typeof globalProps['rawText'] === 'string'
        && (globalProps['rawText'] as string).length > 0
      ? globalProps['rawText'] as string
      : null;

    const rawText = computed(() => {
      if (globalRawText) return globalRawText;
      const scenario = OPENUI_SCENARIOS.find((s) =>
        s.id === selectedScenarioId.value
      );
      return (scenario ?? OPENUI_SCENARIOS[0]!).raw;
    });

    const instant = globalProps['instant'] === true
      || globalProps['instant'] === '1' || globalProps['instant'] === 1;

    const theme = ref<Theme>(readTheme(globalProps['theme']) ?? 'light');

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

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    watch(
      rawText,
      (text) => {
        cancelled = false;
        if (timer !== undefined) clearTimeout(timer);
        loading.value = true;
        isStreaming.value = true;
        error.value = '';
        response.value = '';

        if (instant || speed === 0) {
          response.value = text;
          isStreaming.value = false;
          loading.value = false;
          return;
        }

        let offset = 0;

        const tick = () => {
          if (cancelled || text !== rawText.value) return;
          if (offset >= text.length) {
            isStreaming.value = false;
            return;
          }

          try {
            const chunk = text.slice(offset, offset + DEFAULT_CHUNK_SIZE);
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
      },
      { immediate: true },
    );

    onUnmounted(() => {
      cancelled = true;
      if (timer !== undefined) clearTimeout(timer);
    });

    const onOpenUiAction = (_event: ActionEvent) => {
      // noop for now
    };

    const toggleTheme = () => {
      theme.value = theme.value === 'dark' ? 'light' : 'dark';
    };

    return (): VNodeChild => {
      const themeClassName = theme.value === 'dark'
        ? 'openui-page openui-dark luna-dark'
        : 'openui-page openui-light luna-light';

      return h('view', { class: themeClassName }, [
        h('view', { class: 'demo-toolbar' }, [
          h(
            'scroll-view',
            { 'scroll-x': true, class: 'demo-strip' },
            [
              h(
                'view',
                { class: 'demo-strip-row' },
                OPENUI_SCENARIOS.map((scenario) =>
                  h(
                    'view',
                    {
                      key: scenario.id,
                      class: scenario.id === selectedScenarioId.value
                        ? 'demo-chip demo-chip-active'
                        : 'demo-chip',
                      bindtap: () => {
                        selectedScenarioId.value = scenario.id;
                      },
                    },
                    [h('text', { class: 'demo-chip-text' }, scenario.title)],
                  )
                ),
              ),
            ],
          ),
          h(
            'view',
            { class: 'demo-theme-toggle', bindtap: toggleTheme },
            [
              h(
                'text',
                { class: 'demo-theme-toggle-text' },
                theme.value === 'dark' ? '☀' : '☾',
              ),
            ],
          ),
        ]),
        error.value
          ? h('view', { class: 'openui-feedback' }, [
            h('text', { class: 'openui-error' }, error.value),
          ])
          : null,
        loading.value
          ? h('view', { class: 'openui-feedback' }, [h('text', 'Loading...')])
          : null,
        response.value
          ? h(
            'scroll-view',
            { 'scroll-y': true, class: 'openui-scroll' },
            [
              h(OpenUiRenderer, {
                key: selectedScenarioId.value,
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
    };
  },
});
