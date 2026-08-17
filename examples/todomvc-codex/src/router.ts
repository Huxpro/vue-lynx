import {
  createMemoryHistory,
  createRouter,
  createWebHashHistory,
  type RouteRecordRaw,
} from 'vue-router';
import type { TodoVisibility } from './todo';

const NullRouteView = {
  name: 'TodoRouteView',
  render: () => null,
};

export const visibilityPaths: Record<TodoVisibility, string> = {
  all: '/',
  active: '/active',
  completed: '/completed',
};

export const visibilityLinks = [
  { name: 'all', label: 'All', to: visibilityPaths.all },
  { name: 'active', label: 'Active', to: visibilityPaths.active },
  { name: 'completed', label: 'Completed', to: visibilityPaths.completed },
] as const;

function supportsWebHashHistory(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof document !== 'undefined' &&
    typeof window.location !== 'undefined'
  );
}

export const usesMemoryHistory = !supportsWebHashHistory();

const routes: RouteRecordRaw[] = [
  { path: visibilityPaths.all, name: 'all', component: NullRouteView },
  { path: visibilityPaths.active, name: 'active', component: NullRouteView },
  { path: visibilityPaths.completed, name: 'completed', component: NullRouteView },
  { path: '/:pathMatch(.*)*', redirect: visibilityPaths.all },
];

const router = createRouter({
  history: usesMemoryHistory ? createMemoryHistory() : createWebHashHistory(),
  routes,
});

export function visibilityFromRouteName(name: unknown): TodoVisibility {
  if (name === 'active' || name === 'completed') {
    return name;
  }

  return 'all';
}

export default router;
