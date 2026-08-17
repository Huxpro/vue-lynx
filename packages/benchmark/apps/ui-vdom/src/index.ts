import { createApp } from 'vue-lynx';
import { createNativeStartupMarker } from '../../../shared/native-bench';

// @ts-expect-error .vue resolution is handled by the bundler
import App from './App.vue';

const markNativeMountComplete = createNativeStartupMarker(lynx);
createApp(App).mount();
markNativeMountComplete();
