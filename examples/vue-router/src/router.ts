// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { createRouter, createMemoryHistory } from 'vue-router';
import Home from './views/Home.vue';
import About from './views/About.vue';
import UserList from './views/UserList.vue';
import UserDetail from './views/UserDetail.vue';

const router = createRouter({
  // Lynx has no window.location / window.navigator, so we must use
  // memory history (similar to React Router's MemoryRouter).
  history: createMemoryHistory(),
  routes: [
    { path: '/', name: 'home', component: Home },
    { path: '/about', name: 'about', component: About },
    { path: '/users', name: 'users', component: UserList },
    { path: '/users/:id', name: 'user-detail', component: UserDetail },
  ],
});

export default router;
