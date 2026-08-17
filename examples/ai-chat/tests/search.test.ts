import { describe, expect, it } from 'vitest';

import { fuzzyMatch } from '../src/lib/search';

describe('fuzzyMatch', () => {
  it('matches case-insensitive subsequences and multiple query words', () => {
    expect(fuzzyMatch('Creating a Vue composable', 'cvc')).toBe(true);
    expect(fuzzyMatch('Creating a Vue composable', 'vue comp')).toBe(true);
  });

  it('rejects characters that appear out of order', () => {
    expect(fuzzyMatch('Creating a Vue composable', 'zvue')).toBe(false);
    expect(fuzzyMatch('Creating a Vue composable', 'vcg')).toBe(false);
  });

  it('matches an empty query', () => {
    expect(fuzzyMatch('Anything', '')).toBe(true);
  });
});
