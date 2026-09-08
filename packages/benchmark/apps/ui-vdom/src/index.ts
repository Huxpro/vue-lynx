import { createApp } from 'vue-lynx';

// @ts-expect-error .vue resolution is handled by the bundler
import App from './App.vue';
import { nativeBenchmark } from '../../../shared/native-protocol';

const startup = nativeBenchmark.beginStartup();
createApp(App).mount();
nativeBenchmark.finishStartup(startup);
