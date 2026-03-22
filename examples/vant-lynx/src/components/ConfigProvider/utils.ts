import type { Numeric } from './types';

/** Map `gray1` to `gray-1` */
export function insertDash(str: string) {
  return str.replace(/([a-zA-Z])(\d)/g, '$1-$2');
}

export function kebabCase(str: string) {
  return str
    .replace(/([A-Z])/g, '-$1')
    .toLowerCase()
    .replace(/^-/, '');
}

export function mapThemeVarsToCSSVars(
  themeVars: Record<string, Numeric>,
): Record<string, Numeric> {
  const cssVars: Record<string, Numeric> = {};
  Object.keys(themeVars).forEach((key) => {
    const formattedKey = insertDash(kebabCase(key));
    cssVars[`--van-${formattedKey}`] = themeVars[key];
  });
  return cssVars;
}
