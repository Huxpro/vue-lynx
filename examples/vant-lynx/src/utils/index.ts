export { createNamespace } from './create';
export { addUnit, isDef, isNumeric, padZero, clamp, isSameValue } from './format';
export type { Numeric } from './format';
export { makeStringProp, numericProp, makeNumericProp, makeRequiredProp } from './props'
export const isImage = (name?: string) => name?.includes('/');
