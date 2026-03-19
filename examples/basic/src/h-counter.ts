import {
  createApp,
  defineComponent,
  h,
  onMounted,
  ref,
} from 'vue-lynx';

const Counter = defineComponent({
  name: 'Counter',
  setup() {
    const count = ref(0);

    onMounted(() => {
      // Auto-increment every 2 s to verify reactive updates work without user input
      setInterval(() => {
        count.value++;
      }, 2000);
    });

    return () =>
      h(
        'view',
        { style: { display: 'flex', flexDirection: 'column', padding: 16 } },
        [
          h('text', { style: { fontSize: 24, color: '#333' } }, [
            `Count: ${count.value}`,
          ]),
          h(
            'view',
            {
              style: {
                marginTop: 12,
                padding: '8px 16px',
                backgroundColor: '#0077ff',
                borderRadius: 8,
              },
              bindtap: () => {
                count.value++;
              },
            },
            [h('text', { style: { color: '#fff' } }, ['Tap to increment'])],
          ),
        ],
      );
  },
});

const App = defineComponent({
  name: 'App',
  setup() {
    return () =>
      h('view', { style: { flex: 1 } }, [
        h('text', { style: { fontSize: 18, margin: 16 } }, [
          'Vue 3 × Lynx – h() counter (no SFC)',
        ]),
        h(Counter),
      ]);
  },
});

const app = createApp(App);
app.mount();
