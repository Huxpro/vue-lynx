import { createApp } from 'vue-lynx';
import { createPinia } from 'pinia';

import { mastoLogin } from './composables/masto';
import { DEFAULT_SERVER } from './composables/users';
import router from './router';
import App from './App.vue';

// Anonymous session against the default public instance — Elk's guest mode
// (plugins/0.setup-users.ts does the same with runtimeConfig.defaultServer).
mastoLogin({ server: DEFAULT_SERVER });

const app = createApp(App);
app.use(createPinia());
app.use(router);

// Deep-link support: hosts can pass an initial route via Lynx globalProps
// (native: LynxView globalProps; web: <lynx-view global-props>). `lynx` is
// a bare identifier injected into the card bundle's wrapper scope, not a
// globalThis property.
declare const lynx: { __globalProps?: { initialPath?: string } } | undefined;
let initialPath: string | undefined;
try {
  initialPath = typeof lynx !== 'undefined' ? lynx?.__globalProps?.initialPath : undefined;
}
catch { /* older runtimes without the global */ }
router.push(initialPath || '/');

app.mount();
