// =============================================================================
// Fullscreen single-example player. Opened by the "Web" QR / link on the demo
// slides: `/play.html?bundle=<example>/dist/<name>.web.bundle`. Mounts one live
// <vl-demo> filling the viewport — the browser "experience it" target.
// =============================================================================
import './styles.css';
import { registerVlDemo } from './demo.js';

registerVlDemo();

const bundle =
  new URLSearchParams(location.search).get('bundle') ||
  'todomvc/dist/main.web.bundle';

const stage = document.querySelector('.play__stage');
const demo = document.createElement('vl-demo');
demo.setAttribute('bundle', bundle);
stage.appendChild(demo);

// connectedCallback painted the loading state; kick off the actual load.
customElements.whenDefined('vl-demo').then(() => demo.load?.());
