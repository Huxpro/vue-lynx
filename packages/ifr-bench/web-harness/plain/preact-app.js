// Plain-web Preact baseline: replicates rl-probe's App structure with the
// exact preact fork ReactLynx uses (global build preloaded as `preact`).
(function () {
  const { h, render } = preact;
  // ReactLynx's preact fork resolves the document via options.document
  // (normally pointed at the Lynx element PAPI shim); point it at real DOM.
  preact.options.document = document;
  let alter = false;
  const App = () => {
    const rows = [];
    for (let i = 0; i < 16; i++) {
      rows.push(
        h('div', { class: `row row-${i % 4}`, key: i }, [
          h('img', { class: 'icon', src: 'asset://icon.png' }),
          h('div', { class: 'body' }, [
            h('span', { class: 'title' }, `Row title ${i % 7}`),
            h('span', { class: 'sub' }, 'A static subtitle line'),
          ]),
        ]),
      );
    }
    return h('div', { class: 'page' }, [
      h('div', {
        class: 'hero',
        onClick: () => { alter = !alter; render(h(App, {}), document.getElementById('app')); },
      }, [
        h('span', { class: 'hero-title' }, alter ? 'Tapped' : 'Preact on Web'),
        h('span', { class: 'hero-sub' }, 'baseline probe'),
      ]),
      h('div', { class: 'rows' }, rows),
    ]);
  };
  render(h(App, {}), document.getElementById('app'));
})();
