import { describe, expect, it } from 'vitest';

import { svgFor } from '../src/lib/icons';

describe('native-safe icons', () => {
  it('renders the hamburger with path primitives supported by native Lynx SVG', () => {
    const svg = svgFor('i-lucide-menu', '#71717a');

    expect(svg).toContain('<path');
    expect(svg).not.toContain('<line');
  });
});
