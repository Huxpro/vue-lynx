// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
//
// Vue Lynx port of upstream `playground/lynx-src/a2ui/App.tsx`, extended
// with a self-contained demo picker (the upstream app is a headless
// preview that the React web playground drives via initData/globalProps;
// this port keeps the globalProps hooks but also works standalone).
import {
  computed,
  defineComponent,
  h,
  onUnmounted,
  ref,
  shallowRef,
  watch,
} from 'vue-lynx';
import type { VNodeChild } from 'vue-lynx';

import {
  A2UI,
  Button,
  Card,
  CheckBox,
  ChoicePicker,
  Column,
  DateTimeInput,
  Divider,
  Icon,
  Image,
  LazyComponent,
  LineChart,
  List,
  Loading,
  Modal,
  PieChart,
  RadioGroup,
  Row,
  Slider,
  Tabs,
  Text,
  TextField,
  basicFunctions,
  createMessageStore,
  normalizePayloadToMessages as normalizeProtocolMessages,
} from 'vue-lynx-genui/a2ui';
import type {
  CatalogInput,
  MessageStore,
  ServerToClientMessage,
  UserActionPayload,
} from 'vue-lynx-genui/a2ui';

import { createMockAgent } from '../mock/io-mock/mockAgent.js';
import { STATIC_DEMOS } from '../demos.js';

const DEFAULT_STREAM_DELAY_MS = 800;
const A2UI_SCROLL_VIEW_ID = 'a2ui-scroll-view';
const A2UI_SCROLL_BOTTOM_OFFSET = 1000000;

const ALL_BUILTINS: readonly CatalogInput[] = [
  Text,
  Image,
  Row,
  Column,
  List,
  Card,
  Modal,
  Button,
  Divider,
  LazyComponent,
  Icon,
  CheckBox,
  ChoicePicker,
  DateTimeInput,
  LineChart,
  PieChart,
  Loading,
  RadioGroup,
  Slider,
  TextField,
  Tabs,
  ...basicFunctions,
];

type Theme = 'light' | 'dark';

declare const lynx: {
  __globalProps?: Record<string, unknown>;
  createSelectorQuery(): {
    select(selector: string): {
      invoke(options: {
        method: string;
        params?: Record<string, unknown>;
        fail?: (res: unknown) => void;
      }): { exec(): void };
    };
  };
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
  name: 'A2UIDemoApp',
  setup() {
    const globalProps = readGlobalProps();

    // `?speed=2` streams faster; `?speed=0` / `?instant=1` paints instantly.
    const speedRaw = globalProps['speed'];
    const speed = typeof speedRaw === 'string'
      ? Number(speedRaw)
      : (typeof speedRaw === 'number' ? speedRaw : 1);
    const isInstant = globalProps['instant'] === true
      || globalProps['instant'] === '1' || globalProps['instant'] === 1
      || speed === 0;
    const streamDelay = !Number.isFinite(speed) || speed <= 0
      ? (isInstant ? 0 : DEFAULT_STREAM_DELAY_MS)
      : DEFAULT_STREAM_DELAY_MS / speed;

    const theme = ref<Theme>(readTheme(globalProps['theme']) ?? 'light');

    const initialDemoId = typeof globalProps['demo'] === 'string'
      ? globalProps['demo']
      : STATIC_DEMOS[0]!.id;
    const selectedDemoId = ref(initialDemoId);

    const store = shallowRef<MessageStore | null>(null);
    const error = ref('');
    let agent: ReturnType<typeof createMockAgent> | null = null;

    const selectedDemo = computed(() =>
      STATIC_DEMOS.find((d) => d.id === selectedDemoId.value)
        ?? STATIC_DEMOS[0]!
    );

    // GlobalProps may also carry an inline payload (parity with upstream's
    // initData contract): `messages` wins over the picked demo.
    const inlineMessages = globalProps['messages'];

    watch(
      selectedDemo,
      (demo) => {
        error.value = '';
        agent?.stop();

        try {
          const payload = inlineMessages !== undefined
            ? inlineMessages
            : demo.messages;
          const initialMessages: ServerToClientMessage[] =
            normalizeProtocolMessages(payload);
          const next = createMessageStore();
          agent = createMockAgent(next, {
            initialMessages,
            delayMs: isInstant ? 0 : streamDelay,
          });
          store.value = next;
          void agent.start();
        } catch (e) {
          error.value = String(e);
          store.value = null;
        }
      },
      { immediate: true },
    );

    onUnmounted(() => {
      agent?.stop();
    });

    const scrollPreviewToBottom = () => {
      lynx.createSelectorQuery()
        .select(`#${A2UI_SCROLL_VIEW_ID}`)
        .invoke({
          method: 'scrollTo',
          params: {
            offset: A2UI_SCROLL_BOTTOM_OFFSET,
            smooth: true,
          },
          fail: () => {
            // The first content-size event can fire before UI methods are
            // ready.
          },
        })
        .exec();
    };

    const onAction = (action: UserActionPayload) => {
      // Forward user actions to the mock agent — it pushes the canned
      // response messages back into the same store.
      void agent?.onAction(action);
    };

    const toggleTheme = () => {
      theme.value = theme.value === 'dark' ? 'light' : 'dark';
    };

    return (): VNodeChild => {
      const themeClassName = theme.value === 'dark'
        ? 'luna-dark'
        : 'luna-light';
      const surfaceThemeClassName = theme.value === 'dark'
        ? ' a2ui-dark'
        : ' a2ui-light';

      return h('view', { class: `page ${themeClassName}` }, [
        h('view', { class: 'demo-toolbar' }, [
          h(
            'scroll-view',
            { 'scroll-x': true, class: 'demo-strip' },
            [
              h(
                'view',
                { class: 'demo-strip-row' },
                STATIC_DEMOS.map((demo) =>
                  h(
                    'view',
                    {
                      key: demo.id,
                      class: demo.id === selectedDemoId.value
                        ? 'demo-chip demo-chip-active'
                        : 'demo-chip',
                      bindtap: () => {
                        selectedDemoId.value = demo.id;
                      },
                    },
                    [h('text', { class: 'demo-chip-text' }, demo.title)],
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
          ? h('view', { style: { padding: '12px' } }, [
            h('text', { style: { color: '#c40000' } }, error.value),
          ])
          : h('view', { class: 'a2ui-root-container' }, [
            store.value
              ? h(
                'scroll-view',
                {
                  id: A2UI_SCROLL_VIEW_ID,
                  'scroll-y': true,
                  bindcontentsizechanged: scrollPreviewToBottom,
                  style: { flex: 1, minHeight: 0 },
                },
                [
                  h(A2UI, {
                    // Re-mount the surface session per demo.
                    key: selectedDemoId.value,
                    messageStore: store.value,
                    catalogs: ALL_BUILTINS,
                    onAction,
                    wrapSurface: (c: VNodeChild) =>
                      h('view', { class: surfaceThemeClassName }, [c]),
                    renderFallback: () =>
                      h('view', { style: { padding: '12px' } }, [
                        h('text', 'Streaming...'),
                      ]),
                    className: 'a2ui-container',
                  }),
                ],
              )
              : h('view', { class: 'a2ui-loadingOverlay' }, [
                h('text', { class: 'a2ui-loadingTitle' }, 'loading ...'),
              ]),
          ]),
      ]);
    };
  },
});
