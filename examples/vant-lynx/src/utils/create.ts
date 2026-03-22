/**
 * BEM class name generator matching Vant's createNamespace.
 *
 * Usage:
 *   const [name, bem] = createNamespace('button');
 *   bem()                         → 'van-button'
 *   bem('content')                → 'van-button__content'
 *   bem('icon', { active: true }) → 'van-button__icon van-button__icon--active'
 *   bem([type, size, { round }])  → 'van-button van-button--primary van-button--large van-button--round'
 */
export function createNamespace(name: string) {
  const prefixedName = `van-${name}`;

  function bem(): string;
  function bem(el: string): string;
  function bem(el: string, mods: Record<string, boolean | undefined>): string;
  function bem(mods: Array<string | undefined | Record<string, boolean | undefined>>): string;
  function bem(
    el?: string | Array<string | undefined | Record<string, boolean | undefined>>,
    mods?: Record<string, boolean | undefined>,
  ): string {
    // No args: base class
    if (el === undefined && !mods) return prefixedName;

    // String element: van-{name}__{el}
    if (typeof el === 'string') {
      const base = `${prefixedName}__${el}`;
      if (!mods) return base;
      const classes = [base];
      for (const [key, val] of Object.entries(mods)) {
        if (val) classes.push(`${base}--${key}`);
      }
      return classes.join(' ');
    }

    // Array: modifier form
    if (Array.isArray(el)) {
      const classes = [prefixedName];
      for (const item of el) {
        if (typeof item === 'string' && item) {
          classes.push(`${prefixedName}--${item}`);
        } else if (typeof item === 'object' && item) {
          for (const [key, val] of Object.entries(item)) {
            if (val) classes.push(`${prefixedName}--${key}`);
          }
        }
      }
      return classes.join(' ');
    }

    return prefixedName;
  }

  return [prefixedName, bem] as const;
}
