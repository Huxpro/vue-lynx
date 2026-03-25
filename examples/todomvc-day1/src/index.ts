import './todomvc.css';
import { createApp } from 'vue-lynx';

import TodoApp from './TodoApp.vue';

const app = createApp(TodoApp);
app.mount();
