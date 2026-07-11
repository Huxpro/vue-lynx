// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
//
// End-to-end: <A2UI> renders a mock protocol stream through the full
// vue-lynx dual-thread pipeline into jsdom.
import { afterEach, describe, expect, test } from 'vitest';

import { defineComponent, h, nextTick } from 'vue-lynx';
import { cleanup, render } from 'vue-lynx-testing-library';

import { A2UI } from '../src/a2ui/vue/A2UI.js';
import { createMessageStore } from '../src/a2ui/store/MessageStore.js';
import type { ServerToClientMessage } from '../src/a2ui/store/types.js';
import { Button } from '../src/a2ui/catalog/Button/index.js';
import { Card } from '../src/a2ui/catalog/Card/index.js';
import { Column } from '../src/a2ui/catalog/Column/index.js';
import { Row } from '../src/a2ui/catalog/Row/index.js';
import { Text } from '../src/a2ui/catalog/Text/index.js';

afterEach(cleanup);

const CATALOG = [Text, Button, Card, Column, Row];

function surfaceMessages(): ServerToClientMessage[] {
  return [
    { createSurface: { surfaceId: 's1', catalogId: 'test' } },
    {
      updateComponents: {
        surfaceId: 's1',
        components: [
          { id: 'root', component: 'Column', children: ['title', 'greeting'] },
          { id: 'title', component: 'Text', text: 'Weather', variant: 'h2' },
          { id: 'greeting', component: 'Text', text: { path: '/msg' } },
        ],
      },
    },
    { updateDataModel: { surfaceId: 's1', path: '/msg', value: 'hello vue' } },
  ] as unknown as ServerToClientMessage[];
}

describe('<A2UI> end-to-end', () => {
  test('renders a surface from a pre-filled message store', async () => {
    const store = createMessageStore({ initialMessages: surfaceMessages() });
    const Host = defineComponent({
      name: 'Host',
      setup() {
        return () => h(A2UI, { messageStore: store, catalogs: CATALOG });
      },
    });

    const { container } = render(Host);
    await nextTick();

    expect(container.textContent).toContain('Weather');
    expect(container.textContent).toContain('hello vue');
  });

  test('re-renders when data model updates stream in later', async () => {
    const store = createMessageStore({ initialMessages: surfaceMessages() });
    const Host = defineComponent({
      name: 'Host',
      setup() {
        return () => h(A2UI, { messageStore: store, catalogs: CATALOG });
      },
    });

    const { container } = render(Host);
    await nextTick();
    expect(container.textContent).toContain('hello vue');

    store.push(
      {
        updateDataModel: { surfaceId: 's1', path: '/msg', value: 'updated!' },
      } as unknown as ServerToClientMessage,
    );
    await nextTick();
    await nextTick();

    expect(container.textContent).toContain('updated!');
    expect(container.textContent).not.toContain('hello vue');
  });

  test('renders empty state before beginRendering', async () => {
    const store = createMessageStore();
    const Host = defineComponent({
      name: 'Host',
      setup() {
        return () =>
          h(A2UI, {
            messageStore: store,
            catalogs: CATALOG,
            renderEmpty: () => h('text', 'nothing yet'),
          });
      },
    });

    const { container } = render(Host);
    await nextTick();
    expect(container.textContent).toContain('nothing yet');
  });

  test('dispatches user actions from Button through onAction', async () => {
    const actions: Array<{ name: string }> = [];
    const store = createMessageStore({
      initialMessages: [
        { createSurface: { surfaceId: 's1' } },
        {
          updateComponents: {
            surfaceId: 's1',
            components: [
              { id: 'root', component: 'Card', child: 'btn' },
              {
                id: 'btn',
                component: 'Button',
                child: 'label',
                action: { event: { name: 'submit_order' } },
              },
              { id: 'label', component: 'Text', text: 'Order' },
            ],
          },
        },
      ] as unknown as ServerToClientMessage[],
    });

    const Host = defineComponent({
      name: 'Host',
      setup() {
        return () =>
          h(A2UI, {
            messageStore: store,
            catalogs: CATALOG,
            onAction: (a: { name: string }) => {
              actions.push(a);
            },
          });
      },
    });

    const { container } = render(Host);
    await nextTick();
    expect(container.textContent).toContain('Order');

    // Find the tappable button element and fire its Lynx tap handler
    // through the dual-thread event pipeline.
    const { fireEvent } = await import('vue-lynx-testing-library');
    const buttonEl = container.querySelector('.button');
    expect(buttonEl).not.toBeNull();
    await fireEvent.tap(buttonEl!);
    await nextTick();

    expect(actions.map((a) => a.name)).toEqual(['submit_order']);
  });
});

describe('template expansion after mount', () => {
  test('expands templated children when updateDataModel streams in later', async () => {
    // Regression: the processor mutates component instances in place when
    // expanding `children: { componentId, path }` templates; the renderer
    // must re-resolve even though the component reference is unchanged.
    const store = createMessageStore({
      initialMessages: [
        { createSurface: { surfaceId: 's1' } },
        {
          updateComponents: {
            surfaceId: 's1',
            components: [
              {
                id: 'root',
                component: 'Column',
                children: ['list-row'],
              },
              {
                id: 'list-row',
                component: 'Row',
                children: { componentId: 'item-template', path: '/items' },
              },
              {
                id: 'item-template',
                component: 'Text',
                text: { path: 'label' },
              },
            ],
          },
        },
      ] as unknown as ServerToClientMessage[],
    });

    const Host = defineComponent({
      name: 'Host',
      setup() {
        return () => h(A2UI, { messageStore: store, catalogs: CATALOG });
      },
    });

    const { container } = render(Host);
    await nextTick();
    expect(container.textContent ?? '').not.toContain('alpha');

    store.push(
      {
        updateDataModel: {
          surfaceId: 's1',
          path: '/items',
          value: [{ label: 'alpha' }, { label: 'beta' }],
        },
      } as unknown as ServerToClientMessage,
    );
    await nextTick();
    await nextTick();

    expect(container.textContent).toContain('alpha');
    expect(container.textContent).toContain('beta');
  });
});
