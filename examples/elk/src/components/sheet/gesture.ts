export const SHEET_GESTURE_LOCK_DISTANCE = 8;

export function clampDownwardDrag(deltaY: number): number {
  'main thread';
  return Math.max(0, deltaY);
}

export function isDownwardSheetGesture(deltaX: number, deltaY: number): boolean {
  'main thread';
  return deltaY > 0
    && Math.abs(deltaY) >= SHEET_GESTURE_LOCK_DISTANCE
    && Math.abs(deltaY) > Math.abs(deltaX);
}

export function shouldDismissSheet(distance: number, threshold = 120): boolean {
  'main thread';
  return distance >= threshold;
}
