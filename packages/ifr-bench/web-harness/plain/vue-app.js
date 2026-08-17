// Plain-web Vue baseline: replicates examples/hello-world's App.vue structure
// with vanilla @vue/runtime-dom (global build preloaded as `VueRuntimeDOM`).
(function () {
  const { createApp, h, ref } = self.VueRuntimeDOM;
  const App = {
    setup() {
      const alter = ref(false);
      const y = ref(0);
      const jump = () => { y.value = y.value; };
      return () =>
        h('div', { class: 'page', onClick: jump }, [
          h('div', { class: 'Background' }),
          h('div', { class: 'App' }, [
            h('div', { class: 'Banner' }, [
              h('div', {
                class: 'Logo',
                style: { transform: `translateY(${y.value}px)` },
                onClick: () => { alter.value = !alter.value; },
              }, [
                h('img', {
                  src: 'asset://logo.png',
                  class: alter.value ? 'Logo--vue' : 'Logo--lynx',
                }),
              ]),
              h('span', { class: 'Title' }, 'Vue'),
              h('span', { class: 'Subtitle' }, 'on Web'),
            ]),
            h('div', { class: 'Content' }, [
              h('img', { src: 'asset://arrow.png', class: 'Arrow' }),
              h('span', { class: 'Description' }, 'Tap the logo and have fun!'),
              h('span', { class: 'Hint' }, [
                'Edit',
                h('span', { style: { fontStyle: 'italic' } }, ' src/App.vue '),
                'to see updates!',
              ]),
            ]),
            h('div', { style: { flex: '1' } }),
          ]),
        ]);
    },
  };
  createApp(App).mount('#app');
})();
