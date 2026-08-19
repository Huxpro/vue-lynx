import { createApp } from 'vue-lynx/vapor';

import App from './App.vue';

// App is a Vapor component (`<script setup vapor>`), so createApp routes to
// the Vapor runtime — no Virtual DOM is involved on the Background Thread.
const app = createApp(App);
app.mount();
