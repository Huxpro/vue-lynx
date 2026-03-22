export type Numeric = string | number;

export function addUnit(value?: Numeric): string | undefined {
  if (value === undefined || value === '') return undefined;
  if (typeof value === 'number') return `${value}px`;
  return value;
}

export function isDef<T>(val: T): val is NonNullable<T> {
  return val !== undefined && val !== null;
}

export function isNumeric(val: Numeric): boolean {
  return typeof val === 'number' || /^\d+(\.\d+)?$/.test(String(val));
}

export function padZero(num: Numeric, targetLength = 2): string {
  let str = String(num);
  while (str.length < targetLength) {
    str = '0' + str;
  }
  return str;
}

export function clamp(num: number, min: number, max: number): number {
  return Math.min(Math.max(num, min), max);
}

export function isSameValue(newValue: unknown, oldValue: unknown): boolean {
  return JSON.stringify(newValue) === JSON.stringify(oldValue);
}

export const numericProp = [Number, String];

export function makeStringProp<T extends string>(defaultVal: T) {
  return {
    type: String as unknown as () => T,
    default: defaultVal,
  };
}
