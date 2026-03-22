import type { FieldRule } from './types.js';

export function isEmptyValue(value: unknown) {
  if (Array.isArray(value)) {
    return !value.length;
  }
  if (value === 0) {
    return false;
  }
  return !value;
}

export function runSyncRule(value: unknown, rule: FieldRule) {
  if (isEmptyValue(value)) {
    if (rule.required) {
      return false;
    }
    if (rule.validateEmpty === false) {
      return true;
    }
  }
  if (rule.pattern && !rule.pattern.test(String(value))) {
    return false;
  }
  return true;
}

export function runRuleValidator(value: unknown, rule: FieldRule) {
  return new Promise<boolean | string>((resolve) => {
    const returnVal = rule.validator!(value, rule);

    if (returnVal && typeof (returnVal as Promise<any>).then === 'function') {
      (returnVal as Promise<boolean | string>).then(resolve);
      return;
    }

    resolve(returnVal as boolean | string);
  });
}

export function getRuleMessage(value: unknown, rule: FieldRule) {
  const { message } = rule;

  if (typeof message === 'function') {
    return message(value, rule);
  }
  return message || '';
}

// Emoji-safe string length
export function getStringLength(str: string) {
  return [...str].length;
}

// Cut string respecting emoji boundaries
export function cutString(str: string, maxlength: number) {
  return [...str].slice(0, maxlength).join('');
}

// Format number string: allow decimal point and negative sign
export function formatNumber(
  value: string,
  allowDot = true,
  allowMinus = true,
) {
  if (allowDot) {
    const dotIndex = value.indexOf('.');
    if (dotIndex > -1) {
      // Keep only the first dot
      value =
        value.slice(0, dotIndex + 1) + value.slice(dotIndex + 1).replace(/\./g, '');
    }
  } else {
    value = value.replace(/\./g, '');
  }

  if (allowMinus) {
    const minusIndex = value.indexOf('-');
    if (minusIndex > -1) {
      // Keep only the leading minus
      value =
        value.slice(0, minusIndex + 1) + value.slice(minusIndex + 1).replace(/-/g, '');
    }
  } else {
    value = value.replace(/-/g, '');
  }

  const regExp = allowDot ? /[^-0-9.]/g : /[^-0-9]/g;
  return value.replace(regExp, '');
}

export function clamp(num: number, min: number, max: number): number {
  return Math.min(Math.max(num, min), max);
}

export function toArray<T>(item: T | T[]): T[] {
  if (Array.isArray(item)) {
    return item;
  }
  return [item];
}
