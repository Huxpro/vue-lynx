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
        { style: { display: 'flex', flexDirection: 'column', padding: '16px' } },
        [
          h('text', { style: { fontSize: '24px', color: '#333' } }, [
            `Count: ${count.value}`,
          ]),
          h(
            'view',
            {
              style: {
                marginTop: '12px',
                padding: '8px 16px',
                backgroundColor: '#0077ff',
                borderRadius: '8px',
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
        h('text', { style: { fontSize: '18px', margin: '16px' } }, [
          'Vue 3 × Lynx – h() counter (no SFC)',
        ]),
        h(Counter),
      ]);
  },
});

const app = createApp(App);
app.mount();
