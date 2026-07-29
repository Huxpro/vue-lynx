export const COLORS = [
  '#3b82f6',
  '#8b5cf6',
  '#06b6d4',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#ec4899',
  '#6366f1',
] as const;

export function makeCards(count: number, prefix = 'Item') {
  return Array.from({ length: count }, (_, i) => ({
    id: `${prefix}-${i + 1}`,
    title: `${prefix} ${i + 1}`,
    body: `A short description for ${prefix.toLowerCase()} ${i + 1}.`,
    color: COLORS[i % COLORS.length],
    height: 88 + ((i * 17) % 72),
  }));
}
