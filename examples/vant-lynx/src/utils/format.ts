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

export const numericProp = [Number, String];

export function makeStringProp<T extends string>(defaultVal: T) {
  return {
    type: String as unknown as () => T,
    default: defaultVal,
  };
}
