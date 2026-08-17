import { computed, ref } from 'vue-lynx';

import { apiFetch } from '../lib/api';

export interface SessionUser {
  id: string;
  username: string;
  name?: string;
  avatar?: string;
}

const user = ref<SessionUser | null>(null);
let fetched = false;

/**
 * Replaces nuxt-auth-utils' useUserSession(). GitHub OAuth popups are not
 * possible on Lynx (no window.open), so login() signs in the server's demo
 * user — every auth-gated surface still works (PRD F5.1).
 */
export function useSession() {
  async function fetchSession() {
    try {
      const data = await apiFetch<{ user: SessionUser | null }>('/api/session');
      user.value = data.user;
    } catch {
      user.value = null;
    }
    fetched = true;
  }

  if (!fetched) {
    fetched = true;
    void fetchSession();
  }

  async function login() {
    const data = await apiFetch<{ user: SessionUser }>('/api/session/login', {
      method: 'POST',
    });
    user.value = data.user;
  }

  async function clear() {
    await apiFetch('/api/session', { method: 'DELETE' });
    user.value = null;
  }

  return {
    user,
    loggedIn: computed(() => Boolean(user.value)),
    fetchSession,
    login,
    clear,
  };
}
