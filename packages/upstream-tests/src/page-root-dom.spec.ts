import {
  createApp,
  defineComponent,
  h,
  nextTick,
} from 'vue-lynx';

interface TestEnvironment {
  switchToMainThread(): void;
  switchToBackgroundThread(): void;
  env: { window: { document: Document } };
}

it('reuses one native page through the complete BG-to-MT pipeline', async () => {
  const env = (globalThis as Record<string, unknown>)[
    'lynxTestingEnv'
  ] as TestEnvironment;

  env.switchToMainThread();
  const renderPage = (globalThis as Record<string, unknown>)[
    'renderPage'
  ] as (data: Record<string, unknown>) => void;
  renderPage({});

  env.switchToBackgroundThread();
  const App = defineComponent({
    setup() {
      return () =>
        h('page', { class: 'native-root' }, [
          h('view', { id: 'content' }),
        ]);
    },
  });
  const app = createApp(App);
  app.mount();
  await nextTick();

  env.switchToMainThread();
  const document = env.env.window.document;
  const pages = document.body.querySelectorAll('page');
  expect(pages).toHaveLength(1);
  expect(pages[0]?.className).toBe('native-root');
  expect(pages[0]?.querySelector('view#content')).not.toBeNull();

  env.switchToBackgroundThread();
  app.unmount();
});
