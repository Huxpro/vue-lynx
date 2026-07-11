// Ported from elk: app/composables/i18n.ts formatting helpers.
// Elk uses @vueuse/core useTimeAgo + Intl via vue-i18n; these are the same
// formats without the VueUse/vue-i18n dependencies.

const compactFormatter = typeof Intl !== 'undefined' && Intl.NumberFormat
  ? new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 })
  : undefined;

export function formatCompactNumber(n: number): string {
  if (compactFormatter)
    return compactFormatter.format(n);
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

/** Short relative timestamp, matching Elk's timeline style ("2m", "3h", "5d"). */
export function formatTimeAgo(dateString: string, now: number = Date.now()): string {
  const date = new Date(dateString).getTime();
  const seconds = Math.round((now - date) / 1000);

  if (seconds < 60) return 'now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d`;
  const months = Math.round(days / 30);
  if (months < 12) return `${months}mo`;
  return `${Math.round(months / 12)}y`;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Full timestamp for status detail pages (Elk shows a localized full date). */
export function formatFullDate(dateString: string): string {
  const d = new Date(dateString);
  const hours = d.getHours();
  const h12 = hours % 12 || 12;
  const ampm = hours < 12 ? 'AM' : 'PM';
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}, ${h12}:${min} ${ampm}`;
}
