// =============================================================================
// Fullscreen single-example player. Opened by the "Web" QR / link on the demo
// slides: `/play.html?bundle=<example>/dist/<name>.web.bundle`. Mounts one live
// <vl-demo> inside the shared device frame (framework/device.js): defaults to
// mobile, switchable to tablet or desktop (fullscreen), and freely resizable.
// =============================================================================
import './styles.css';
import { registerVlDemo } from './demo.js';
import { attachDeviceControls } from './framework/device.js';

registerVlDemo();

// Play-page presets sized against the viewport (no scaled stage here). Phone
// matches the deck's ~125% handset scale; tablet height is unchanged. Desktop
// fills the whole window.
const PLAY_PRESETS = {
  phone:   { ar: '9 / 19.5', w: 'auto', h: 'min(112.5vh, 1075px)' },
  tablet:  { ar: '3 / 4',    w: 'auto', h: 'min(92vh, 1000px)' },
  desktop: { fullscreen: true },
};

const bundle =
  new URLSearchParams(location.search).get('bundle') ||
  'todomvc/dist/main.web.bundle';

const stage = document.querySelector('.play__stage');

const device = document.createElement('div');
device.className = 'phone phone--play';
const inner = document.createElement('div');
inner.className = 'phone__inner';
const demo = document.createElement('vl-demo');
demo.setAttribute('bundle', bundle);
inner.appendChild(demo);
device.appendChild(inner);
stage.appendChild(device);

attachDeviceControls(device, {
  presets: PLAY_PRESETS,
  initial: 'phone',
  clamp: [220, 2400],
});

// connectedCallback painted the loading state; kick off the actual load.
customElements.whenDefined('vl-demo').then(() => demo.load?.());
