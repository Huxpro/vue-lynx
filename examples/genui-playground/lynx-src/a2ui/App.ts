// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
//
// Vue Lynx port of upstream `playground/lynx-src/a2ui/App.tsx`: a headless
// A2UI preview that the web playground shell drives via `globalProps`
// (payload, streaming pace, theme) and global events (playback control /
// progress, live and replay message pushes, mocked action responses).
//
// Divergence from upstream: only `globalProps` is read. Upstream also
// merges `initData`, but its own web render page mirrors everything into
// `globalProps`, and native previews pass query params the same way.
import {
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

import { createMockAgent } from '../../examples/io-mock/mockAgent.js';
import type { MockAgentProgress } from '../../examples/io-mock/mockAgent.js';

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
type ActionMocks = Record<
  string,
  | ServerToClientMessage[]
  | ((ctx: UserActionPayload) => ServerToClientMessage[])
>;

interface GlobalEventEmitter {
  addListener(name: string, listener: (...args: unknown[]) => void): void;
  removeListener(name: string, listener: (...args: unknown[]) => void): void;
}

declare const lynx: {
  __globalProps?: Record<string, unknown>;
  getJSModule(name: 'GlobalEventEmitter'): GlobalEventEmitter;
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

declare const NativeModules: {
  bridge?: {
    call?: (
      name: string,
      data: Record<string, unknown>,
      callback: (res?: unknown) => void,
    ) => void;
  };
};

interface StreamConfig {
  messagesUrl?: string;
  messages?: unknown;
  actionMocksUrl?: string;
  actionMocks?: unknown;
  instant?: boolean;
  playbackMode?: boolean;
  playbackPaused?: boolean;
  theme?: Theme;
  liveAction?: boolean;
}

function readGlobalProps(): Record<string, unknown> {
  try {
    return (lynx.__globalProps ?? {}) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function parseJsonLikeString(input: string): unknown {
  try {
    return JSON.parse(input) as unknown;
  } catch {
    // ignore
  }

  // Query params may arrive URL-encoded one or more times in native
  // globalProps.
  let current = input;
  for (let i = 0; i < 3; i++) {
    try {
      const decoded = decodeURIComponent(current);
      if (decoded === current) break;
      current = decoded;
      try {
        return JSON.parse(current) as unknown;
      } catch {
        // keep decoding
      }
    } catch {
      break;
    }
  }

  return input;
}

function decodeUrlString(input: string): string {
  let current = input;
  for (let i = 0; i < 3; i++) {
    try {
      const decoded = decodeURIComponent(current);
      if (decoded === current) break;
      current = decoded;
    } catch {
      break;
    }
  }
  return current;
}

function readFlag(value: unknown): boolean | undefined {
  if (value === undefined) return undefined;
  return value === true || value === '1' || value === 1;
}

function normalizeStreamConfig(raw: Record<string, unknown>): StreamConfig {
  const out: StreamConfig = {};

  if (typeof raw['messagesUrl'] === 'string') {
    out.messagesUrl = decodeUrlString(raw['messagesUrl']);
  }
  if (typeof raw['actionMocksUrl'] === 'string') {
    out.actionMocksUrl = decodeUrlString(raw['actionMocksUrl']);
  }
  if (raw['messages'] !== undefined) {
    out.messages = typeof raw['messages'] === 'string'
      ? parseJsonLikeString(raw['messages'])
      : raw['messages'];
  }
  if (raw['actionMocks'] !== undefined) {
    out.actionMocks = typeof raw['actionMocks'] === 'string'
      ? parseJsonLikeString(raw['actionMocks'])
      : raw['actionMocks'];
  }

  out.instant = readFlag(raw['instant']);
  out.playbackMode = readFlag(raw['playbackMode']);
  if (typeof raw['playbackPaused'] === 'boolean') {
    out.playbackPaused = raw['playbackPaused'];
  }
  out.liveAction = readFlag(raw['liveAction']);

  const theme = raw['theme'];
  if (theme === 'light' || theme === 'dark') {
    out.theme = theme;
  } else if (theme === 'Dark' || theme === 'Light') {
    out.theme = theme.toLowerCase() as Theme;
  }

  return out;
}

async function loadMessages(
  config: StreamConfig,
): Promise<ServerToClientMessage[]> {
  if (config.messagesUrl) {
    const res = await fetch(config.messagesUrl, { cache: 'no-store' });
    const text = await res.text();
    try {
      return normalizeProtocolMessages(JSON.parse(text));
    } catch {
      return normalizeProtocolMessages(text);
    }
  }
  if (config.messages !== undefined) {
    return normalizeProtocolMessages(config.messages);
  }
  return [];
}

async function loadActionMocks(
  config: StreamConfig,
): Promise<Record<string, unknown>> {
  if (config.actionMocksUrl) {
    const res = await fetch(config.actionMocksUrl, { cache: 'no-store' });
    const text = await res.text();
    try {
      const parsed = JSON.parse(text) as unknown;
      if (parsed && typeof parsed === 'object') {
        return parsed as Record<string, unknown>;
      }
      return {};
    } catch {
      return {};
    }
  }
  if (config.actionMocks && typeof config.actionMocks === 'object') {
    return config.actionMocks as Record<string, unknown>;
  }
  return {};
}

export const App = defineComponent({
  name: 'A2UIPlaygroundApp',
  setup() {
    const globalProps = readGlobalProps();
    const config = normalizeStreamConfig(globalProps);

    // Per-batch delay (ms) the mock agent waits between successive
    // protocol messages. `?speed=2` streams faster; `?speed=0` paints the
    // full stream with no delay.
    const speedRaw = globalProps['speed'];
    const speed = typeof speedRaw === 'string'
      ? Number(speedRaw)
      : (typeof speedRaw === 'number' ? speedRaw : 1);
    const streamDelay = !Number.isFinite(speed) || speed < 0
      ? DEFAULT_STREAM_DELAY_MS
      : (speed === 0 ? 0 : DEFAULT_STREAM_DELAY_MS / speed);

    const isInstantPreview = config.instant === true;
    const playbackMode = config.playbackMode === true;
    const theme: Theme = config.theme ?? 'light';

    const store = shallowRef<MessageStore | null>(null);
    const error = ref('');
    const isPlaybackPaused = ref(config.playbackPaused === true);
    const playbackTargetCount = ref(0);

    let agent: ReturnType<typeof createMockAgent> | null = null;
    let liveStore: MessageStore | null = null;
    let pendingReplayMessages: unknown[] | null = null;
    let pendingLiveMessages: unknown[] | null = null;
    let cancelled = false;

    const pushLiveMessagesToStore = (
      targetStore: MessageStore,
      messages: unknown,
    ) => {
      const normalized = normalizeProtocolMessages(messages);
      for (const msg of normalized) {
        targetStore.push(msg);
      }
    };

    const replayMessagesToStore = (
      targetStore: MessageStore,
      messages: unknown,
    ) => {
      targetStore.clear();
      pushLiveMessagesToStore(targetStore, messages);
    };

    const postPlaybackSync = (state: MockAgentProgress) => {
      NativeModules.bridge?.call?.(
        'A2UI_PLAYBACK_SYNC',
        state as unknown as Record<string, unknown>,
        () => {
          // jsb callback
        },
      );
    };

    // In playback mode the parent frame is the single ticker — the agent
    // drains instantly up to the target chunk count it announces via
    // `A2UI_PLAYBACK_PROGRESS`.
    const syncPlaybackAgent = () => {
      if (!agent) return;
      if (!playbackMode) return;
      const currentCount = liveStore?.getSnapshot().length ?? 0;
      if (isPlaybackPaused.value || currentCount >= playbackTargetCount.value) {
        agent.pause();
        return;
      }
      agent.resume();
    };

    const scrollPreviewToBottom = () => {
      if (isPlaybackPaused.value) return;
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

    // ── Global events from the shell (render.tsx forwards postMessage) ──

    const emitter = lynx.getJSModule('GlobalEventEmitter');
    const listeners: Array<[string, (...args: unknown[]) => void]> = [];
    const listen = (name: string, fn: (...args: unknown[]) => void) => {
      emitter.addListener(name, fn);
      listeners.push([name, fn]);
    };

    listen('A2UI_PLAYBACK_CONTROL', (action) => {
      if (!agent) return;
      // In playback mode the parent ticker is the source of truth — route
      // both pause and resume through `syncPlaybackAgent` so resume only
      // unblocks the agent while `currentCount < playbackTargetCount`.
      if (playbackMode) {
        isPlaybackPaused.value = action === 'pause';
        syncPlaybackAgent();
        return;
      }
      if (action === 'pause') {
        agent.pause();
        return;
      }
      if (action === 'resume') {
        agent.resume();
      }
    });

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

    listen('A2UI_ACTION_RESPONSE', (messages) => {
      if (!liveStore) return;
      pushLiveMessagesToStore(liveStore, messages);
    });

    listen('A2UI_REPLAY_MESSAGES', (messages) => {
      const list = Array.isArray(messages) ? messages : [messages];
      if (!liveStore) {
        pendingReplayMessages = list;
        return;
      }
      // Replays replace the preview buffer, making parent retries
      // idempotent while the iframe and Lynx store finish booting.
      replayMessagesToStore(liveStore, list);
      agent?.stop();
      agent = null;
    });

    listen('A2UI_LIVE_MESSAGES', (messages) => {
      const list = Array.isArray(messages) ? messages : [messages];
      if (!liveStore) {
        pendingLiveMessages = list;
        return;
      }
      pushLiveMessagesToStore(liveStore, list);
      agent?.stop();
      agent = null;
    });

    watch([isPlaybackPaused, playbackTargetCount], () => {
      syncPlaybackAgent();
    });

    // ── Boot: load payload, create store + mock agent, start streaming ──

    const run = async () => {
      error.value = '';

      const [rawMessages, rawActionMocks] = await Promise.all([
        loadMessages(config),
        loadActionMocks(config),
      ]);
      if (cancelled) return;

      const actionMocks: ActionMocks = {};
      for (const [name, value] of Object.entries(rawActionMocks)) {
        actionMocks[name] = normalizeProtocolMessages(value);
      }

      const next = createMessageStore();
      const nextAgent = createMockAgent(next, {
        initialMessages: rawMessages,
        actionMocks,
        // `delayMs: 0` pushes every message in a tight loop — a static
        // "final state" paint. In playback mode the agent also drains
        // instantly, but only up to the parent-announced target count.
        delayMs: isInstantPreview || playbackMode ? 0 : streamDelay,
        onProgress: (state) => {
          postPlaybackSync(state);
          syncPlaybackAgent();
        },
      });

      agent?.stop();
      agent = nextAgent;
      liveStore = next;
      store.value = next;

      if (pendingReplayMessages) {
        const msgs = pendingReplayMessages;
        pendingReplayMessages = null;
        replayMessagesToStore(next, msgs);
        nextAgent.stop();
        agent = null;
      }
      if (pendingLiveMessages) {
        const msgs = pendingLiveMessages;
        pendingLiveMessages = null;
        pushLiveMessagesToStore(next, msgs);
        nextAgent.stop();
        agent = null;
      }
      syncPlaybackAgent();
      if (agent === nextAgent) {
        void nextAgent.start();
      }
    };

    run().catch((e) => {
      if (!cancelled) {
        error.value = String(e);
        store.value = null;
      }
    });

    onUnmounted(() => {
      cancelled = true;
      for (const [name, fn] of listeners) {
        emitter.removeListener(name, fn);
      }
      agent?.stop();
      agent = null;
      liveStore = null;
    });

    const onAction = (action: UserActionPayload) => {
      if (config.liveAction) {
        NativeModules.bridge?.call?.(
          'A2UI_USER_ACTION',
          action as unknown as Record<string, unknown>,
          () => undefined,
        );
        return;
      }
      // Forward user actions to the mock agent — it pushes the canned
      // response messages back into the same store.
      void agent?.onAction(action);
    };

    const themeClassName = theme === 'dark' ? 'luna-dark' : 'luna-light';
    const surfaceThemeClassName = theme === 'dark'
      ? ' a2ui-dark'
      : ' a2ui-light';

    return (): VNodeChild =>
      h('view', { class: `page ${themeClassName}` }, [
        error.value
          ? h('view', { style: { padding: '12px' } }, [
            h('text', { style: { color: '#c40000' } }, error.value),
          ])
          : h('view', { class: 'a2ui-root-container' }, [
            !isInstantPreview && store.value === null && error.value === ''
              ? h('view', { class: 'a2ui-loadingOverlay' }, [
                h('text', { class: 'a2ui-loadingTitle' }, 'loading ...'),
                h('view', { class: 'a2ui-loadingDots' }, [
                  h('view', { class: 'a2ui-loadingDot' }),
                  h('view', {
                    class: 'a2ui-loadingDot a2ui-loadingDotDelay1',
                  }),
                  h('view', {
                    class: 'a2ui-loadingDot a2ui-loadingDotDelay2',
                  }),
                ]),
              ])
              : null,
            store.value
              ? h(
                'scroll-view',
                {
                  id: A2UI_SCROLL_VIEW_ID,
                  'scroll-y': true,
                  bindcontentsizechanged: scrollPreviewToBottom,
                  style: { flex: 1, minHeight: 0 },
                  class: isPlaybackPaused.value ? 'a2ui-scrollPaused' : '',
                },
                [
                  h(A2UI, {
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
              : null,
          ]),
      ]);
  },
});
