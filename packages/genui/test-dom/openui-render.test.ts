// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
//
// End-to-end: <OpenUiRenderer> renders openui-lang responses through the
// full vue-lynx dual-thread pipeline into jsdom.
import { afterEach, describe, expect, test } from 'vitest';

import { defineComponent, h, nextTick, ref } from 'vue-lynx';
import { cleanup, fireEvent, render } from 'vue-lynx-testing-library';

import { createOpenUiLibrary } from '../src/openui/core/createLibrary.js';
import { OpenUiRenderer } from '../src/openui/core/renderer.js';

afterEach(cleanup);

const library = createOpenUiLibrary();

describe('<OpenUiRenderer> end-to-end', () => {
  test('renders a static Stack + TextContent response', async () => {
    const Host = defineComponent({
      name: 'Host',
      setup() {
        return () =>
          h(OpenUiRenderer, {
            response: 'root = Stack([TextContent("Hello OpenUI")])',
            library,
          });
      },
    });

    const { container } = render(Host);
    await nextTick();

    expect(container.textContent).toContain('Hello OpenUI');
  });

  test('renders cards, tags, buttons from a richer scenario', async () => {
    const response = `root = Stack([
  Card([
    CardHeader("Trip", "3 days"),
    TextContent("Pack light."),
    Tag("travel")
  ]),
  Button("Book now")
])`;
    const Host = defineComponent({
      name: 'Host',
      setup() {
        return () => h(OpenUiRenderer, { response, library });
      },
    });

    const { container } = render(Host);
    await nextTick();

    expect(container.textContent).toContain('Trip');
    expect(container.textContent).toContain('3 days');
    expect(container.textContent).toContain('Pack light.');
    expect(container.textContent).toContain('travel');
    expect(container.textContent).toContain('Book now');
  });

  test('button taps trigger ContinueConversation actions', async () => {
    const events: Array<{ type: string; humanFriendlyMessage: string }> = [];
    const Host = defineComponent({
      name: 'Host',
      setup() {
        return () =>
          h(OpenUiRenderer, {
            response: 'root = Stack([Button("Submit")])',
            library,
            onAction: (e: { type: string; humanFriendlyMessage: string }) => {
              events.push(e);
            },
          });
      },
    });

    const { container } = render(Host);
    await nextTick();

    const button = container.querySelector('.OpenUIButton');
    expect(button).not.toBeNull();
    await fireEvent.tap(button!);
    await nextTick();

    expect(events).toHaveLength(1);
    expect(events[0]!.humanFriendlyMessage).toBe('Submit');
  });

  test('streaming responses grow incrementally', async () => {
    const response = ref('root = Stack([TextContent("First")');
    const Host = defineComponent({
      name: 'Host',
      setup() {
        return () =>
          h(OpenUiRenderer, {
            response: response.value,
            library,
            isStreaming: true,
          });
      },
    });

    const { container } = render(Host);
    await nextTick();
    expect(container.textContent).toContain('First');

    response.value =
      'root = Stack([TextContent("First"), TextContent("Second")])';
    await nextTick();
    await nextTick();

    expect(container.textContent).toContain('First');
    expect(container.textContent).toContain('Second');
  });

  test('$state bindings resolve through the runtime store', async () => {
    const response = [
      '$count = 3',
      'root = Stack([TextContent($count)])',
    ].join('\n');
    const Host = defineComponent({
      name: 'Host',
      setup() {
        return () => h(OpenUiRenderer, { response, library });
      },
    });

    const { container } = render(Host);
    await nextTick();

    expect(container.textContent).toContain('3');
  });
});
