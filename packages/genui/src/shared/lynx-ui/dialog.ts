// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

// Minimal Vue reimplementation of `@lynx-js/lynx-ui-dialog` (React-only
// upstream). The upstream presence system drives `ui-entering` /
// `ui-open` / `ui-leaving` / `ui-closed` classes through animation-event
// plumbing; this port applies the same classes with a simple timer-based
// leave transition so the packaged genui CSS animates unchanged.
import {
  computed,
  defineComponent,
  h,
  inject,
  provide,
  ref,
  watch,
} from '@vue/runtime-core';
import type {
  ComputedRef,
  InjectionKey,
  SetupContext,
  VNodeChild,
} from '@vue/runtime-core';

type PresencePhase = 'open' | 'leaving' | 'closed';

interface DialogState {
  show: ComputedRef<boolean>;
  phase: ComputedRef<PresencePhase>;
  requestClose: () => void;
}

const DialogContextKey: InjectionKey<DialogState> = Symbol('lynx-ui-dialog');

const LEAVE_DURATION_MS = 220;

function presenceClass(
  className: string | undefined,
  phase: PresencePhase,
  transition: boolean | undefined,
): unknown {
  if (!transition) return className;
  return [className, {
    'ui-open': phase === 'open',
    'ui-leaving': phase === 'leaving',
    'ui-closed': phase === 'closed',
  }];
}

export const DialogRoot = defineComponent({
  name: 'DialogRoot',
  props: ['show', 'defaultShow', 'forceMount', 'onShowChange', 'onOpen', 'onClose'],
  setup(
    props: {
      show?: boolean;
      defaultShow?: boolean;
      forceMount?: boolean;
      onShowChange?: (show: boolean) => void;
      onOpen?: () => void;
      onClose?: () => void;
    },
    { slots }: SetupContext,
  ) {
    const uncontrolledShow = ref(props.defaultShow ?? false);
    const actualShow = computed(() =>
      props.show !== undefined ? props.show : uncontrolledShow.value
    );

    const phase = ref<PresencePhase>(actualShow.value ? 'open' : 'closed');
    let leaveTimer: ReturnType<typeof setTimeout> | undefined;

    watch(actualShow, (show) => {
      if (leaveTimer !== undefined) {
        clearTimeout(leaveTimer);
        leaveTimer = undefined;
      }
      if (show) {
        phase.value = 'open';
        props.onOpen?.();
      } else {
        phase.value = 'leaving';
        leaveTimer = setTimeout(() => {
          phase.value = 'closed';
          props.onClose?.();
        }, LEAVE_DURATION_MS);
      }
    });

    const requestClose = () => {
      props.onShowChange?.(false);
      uncontrolledShow.value = false;
    };

    provide(DialogContextKey, {
      show: actualShow,
      phase: computed(() => phase.value),
      requestClose,
    });

    return (): VNodeChild => slots['default']?.();
  },
});

export const DialogView = defineComponent({
  name: 'DialogView',
  props: ['className', 'style', 'overlayLevel', 'transition', 'dialogViewProps'],
  setup(
    props: {
      className?: string;
      style?: Record<string, unknown>;
      overlayLevel?: number;
      transition?: boolean;
      dialogViewProps?: Record<string, unknown>;
    },
    { slots }: SetupContext,
  ) {
    const dialog = inject(DialogContextKey, null);

    return (): VNodeChild => {
      if (!dialog) return null;
      const mounted = dialog.show.value || dialog.phase.value === 'leaving';
      if (!mounted) return null;
      return h(
        'view',
        {
          class: props.className,
          style: {
            position: 'fixed',
            zIndex: 100 + (props.overlayLevel ?? 0),
            ...props.style,
          },
          ...props.dialogViewProps,
        },
        slots['default']?.(),
      );
    };
  },
});

export const DialogBackdrop = defineComponent({
  name: 'DialogBackdrop',
  props: [
    'className',
    'style',
    'clickToClose',
    'transition',
    'dialogBackdropProps',
    'onClick',
  ],
  setup(
    props: {
      className?: string;
      style?: Record<string, unknown>;
      clickToClose?: boolean;
      transition?: boolean;
      dialogBackdropProps?: Record<string, unknown>;
      onClick?: () => void;
    },
    { slots }: SetupContext,
  ) {
    const dialog = inject(DialogContextKey, null);

    const handleClick = () => {
      if (!(props.clickToClose ?? true)) return;
      dialog?.requestClose();
      props.onClick?.();
    };

    return (): VNodeChild =>
      h(
        'view',
        {
          class: presenceClass(
            props.className,
            dialog?.phase.value ?? 'open',
            props.transition,
          ),
          bindtap: handleClick,
          'event-through': false,
          style: {
            width: '100%',
            height: '100%',
            position: 'absolute',
            ...props.style,
          },
          ...props.dialogBackdropProps,
        },
        slots['default']?.(),
      );
  },
});

export const DialogContent = defineComponent({
  name: 'DialogContent',
  props: ['className', 'style', 'transition', 'dialogContentProps'],
  setup(
    props: {
      className?: string;
      style?: unknown;
      transition?: boolean;
      dialogContentProps?: Record<string, unknown>;
    },
    { slots }: SetupContext,
  ) {
    const dialog = inject(DialogContextKey, null);

    return (): VNodeChild =>
      h(
        'view',
        {
          class: presenceClass(
            props.className,
            dialog?.phase.value ?? 'open',
            props.transition,
          ),
          style: props.style,
          'event-through': false,
          ...props.dialogContentProps,
        },
        slots['default']?.(),
      );
  },
});
