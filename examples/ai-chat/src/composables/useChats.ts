import { computed, ref } from 'vue-lynx';

import { apiFetch } from '../lib/api';

export interface UIChat {
  id: string;
  label: string;
  to: string;
  icon: string;
  createdAt: string;
}

const chats = ref<UIChat[]>([]);

async function fetchChats() {
  try {
    const data = await apiFetch<
      Array<{ id: string; title: string | null; createdAt: string }>
    >('/api/chats');
    chats.value = data.map((chat) => ({
      id: chat.id,
      label: chat.title || 'Untitled',
      to: `/chat/${chat.id}`,
      icon: 'i-lucide-message-circle',
      createdAt: chat.createdAt,
    }));
  } catch (error) {
    console.error(error);
    chats.value = [];
  }
}

function updateChat(id: string, partial: Partial<UIChat>) {
  chats.value = chats.value.map((c) => (c.id === id ? { ...c, ...partial } : c));
}

function removeChat(id: string) {
  chats.value = chats.value.filter((c) => c.id !== id);
}

// Date-group helpers (the original uses date-fns isToday/isYesterday/subMonths;
// re-implemented inline to keep the example dependency-free).
function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/**
 * Shared chats store + the original's date grouping (Today / Yesterday /
 * Last week / Last month / "January 2023"-style buckets), ported verbatim
 * from app/composables/useChats.ts.
 */
export function useChats() {
  const groups = computed(() => {
    const today: UIChat[] = [];
    const yesterday: UIChat[] = [];
    const lastWeek: UIChat[] = [];
    const lastMonth: UIChat[] = [];
    const older: Record<string, UIChat[]> = {};

    const now = new Date();
    const yesterdayDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7.5 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    chats.value.forEach((chat) => {
      const chatDate = new Date(chat.createdAt);

      if (isSameDay(chatDate, now)) {
        today.push(chat);
      } else if (isSameDay(chatDate, yesterdayDate)) {
        yesterday.push(chat);
      } else if (chatDate >= oneWeekAgo) {
        lastWeek.push(chat);
      } else if (chatDate >= oneMonthAgo) {
        lastMonth.push(chat);
      } else {
        const monthYear = `${MONTHS[chatDate.getMonth()]} ${chatDate.getFullYear()}`;
        (older[monthYear] ||= []).push(chat);
      }
    });

    const sortedMonthYears = Object.keys(older).sort(
      (a, b) => new Date(b).getTime() - new Date(a).getTime(),
    );

    const formattedGroups: Array<{ id: string; label: string; items: UIChat[] }> = [];

    if (today.length) formattedGroups.push({ id: 'today', label: 'Today', items: today });
    if (yesterday.length) {
      formattedGroups.push({ id: 'yesterday', label: 'Yesterday', items: yesterday });
    }
    if (lastWeek.length) {
      formattedGroups.push({ id: 'last-week', label: 'Last week', items: lastWeek });
    }
    if (lastMonth.length) {
      formattedGroups.push({ id: 'last-month', label: 'Last month', items: lastMonth });
    }
    sortedMonthYears.forEach((monthYear) => {
      formattedGroups.push({ id: monthYear, label: monthYear, items: older[monthYear]! });
    });

    return formattedGroups;
  });

  return { chats, groups, fetchChats, updateChat, removeChat };
}
