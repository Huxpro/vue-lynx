import { useRoute, useRouter } from 'vue-router';

import { apiFetch } from '../lib/api';
import { useChats } from './useChats';
import { useOverlay } from './useOverlay';
import { useToast } from './useToast';

/**
 * Port of app/composables/useChatActions.ts — rename/delete flows through
 * the overlay system (LazyModalRename/LazyModalConfirm equivalents).
 */
export function useChatActions() {
  const route = useRoute();
  const router = useRouter();
  const toast = useToast();
  const overlay = useOverlay();
  const { updateChat, removeChat } = useChats();

  async function renameChat(id: string, currentTitle?: string | null): Promise<string | null> {
    const instance = overlay.open<string | false>('rename', { title: currentTitle ?? '' });
    const result = await instance.result;

    if (!result || result === currentTitle) return null;

    try {
      await apiFetch(`/api/chats/${id}/title`, {
        method: 'PATCH',
        body: { title: result },
      });
      updateChat(id, { label: result });
      return result;
    } catch {
      toast.add({
        description: 'Failed to rename chat',
        icon: 'i-lucide-alert-circle',
        color: 'error',
      });
      return null;
    }
  }

  async function deleteChat(id: string): Promise<boolean> {
    const instance = overlay.open<boolean>('confirm', {
      title: 'Delete chat',
      description: 'Are you sure you want to delete this chat? This cannot be undone.',
      color: 'error',
    });
    const result = await instance.result;
    if (!result) return false;

    try {
      await apiFetch(`/api/chats/${id}`, { method: 'DELETE' });
      toast.add({
        title: 'Chat deleted',
        description: 'Your chat has been deleted',
        icon: 'i-lucide-trash',
      });
      removeChat(id);
      if (route.params.id === id) {
        router.push('/');
      }
      return true;
    } catch {
      toast.add({
        description: 'Failed to delete chat',
        icon: 'i-lucide-alert-circle',
        color: 'error',
      });
      return false;
    }
  }

  return { renameChat, deleteChat };
}
