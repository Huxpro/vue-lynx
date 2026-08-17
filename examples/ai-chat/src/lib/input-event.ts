interface TextInputEventLike {
  detail?: unknown;
  target?: unknown;
}

function valueFrom(candidate: unknown): string | undefined {
  if (typeof candidate === 'string') return candidate;
  if (!candidate || typeof candidate !== 'object') return undefined;
  const value = (candidate as { value?: unknown }).value;
  return typeof value === 'string' ? value : undefined;
}

export function inputEventValue(event: TextInputEventLike): string {
  return valueFrom(event.detail) ?? valueFrom(event.target) ?? '';
}
