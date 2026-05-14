import { createApp } from 'vue-lynx'

import App from './App.vue'

const app = createApp(App)
app.mount()

if (import.meta.webpackHot) {
  import.meta.webpackHot.accept()
}
