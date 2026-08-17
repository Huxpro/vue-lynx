const DEFAULT_NEAR_BOTTOM_THRESHOLD = 72;
const NEW_TURN_TOP_GAP = 16;
const WEB_BOTTOM_OFFSET = 1_000_000;

interface ScrollMetrics {
  scrollTop: number;
  scrollHeight: number;
  viewportHeight: number;
}

interface BottomSpacerMetrics {
  composerHeight: number;
  keyboardHeight: number;
  viewportHeight: number;
  anchoredTurnHeight?: number;
}

interface MessageLaunchMetrics {
  platform?: string;
  viewportHeight: number;
  composerHeight: number;
  keyboardHeight: number;
  messageHeight: number;
}

interface MessageIdentity {
  id: string;
}

function positive(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

export function bottomDistance(metrics: ScrollMetrics): number {
  const scrollTop = Math.max(0, Number.isFinite(metrics.scrollTop) ? metrics.scrollTop : 0);
  return Math.max(0, positive(metrics.scrollHeight) - positive(metrics.viewportHeight) - scrollTop);
}

export function isNearBottom(
  metrics: ScrollMetrics,
  threshold = DEFAULT_NEAR_BOTTOM_THRESHOLD,
): boolean {
  return bottomDistance(metrics) <= positive(threshold);
}

export function calculateBottomSpacer(metrics: BottomSpacerMetrics): number {
  const composerHeight = positive(metrics.composerHeight);
  const keyboardHeight = positive(metrics.keyboardHeight);
  const obstruction = composerHeight + keyboardHeight;

  if (metrics.anchoredTurnHeight === undefined) return obstruction;

  const blankSpace = Math.max(
    0,
    positive(metrics.viewportHeight) -
      obstruction -
      positive(metrics.anchoredTurnHeight) -
      NEW_TURN_TOP_GAP,
  );
  return obstruction + blankSpace;
}

export function turnScrollMode(platform?: string): 'anchor' | 'bottom' {
  return platform === 'web' ? 'bottom' : 'anchor';
}

export function nextWebBottomOffset(current: number): number {
  return current === WEB_BOTTOM_OFFSET ? WEB_BOTTOM_OFFSET - 1 : WEB_BOTTOM_OFFSET;
}

export function calculateMessageLaunchDistance(metrics: MessageLaunchMetrics): number {
  if (turnScrollMode(metrics.platform) === 'bottom') return 0;

  const distance =
    positive(metrics.viewportHeight) -
    positive(metrics.composerHeight) -
    positive(metrics.keyboardHeight) -
    positive(metrics.messageHeight) -
    NEW_TURN_TOP_GAP;

  return Math.min(420, Math.max(44, distance));
}

export function isEarlierMessageDuringHandoff(
  messages: readonly MessageIdentity[],
  messageId: string,
  pendingMessageId: string | null,
): boolean {
  if (!pendingMessageId) return false;
  const pendingIndex = messages.findIndex((message) => message.id === pendingMessageId);
  const messageIndex = messages.findIndex((message) => message.id === messageId);
  return pendingIndex > 0 && messageIndex >= 0 && messageIndex < pendingIndex;
}
