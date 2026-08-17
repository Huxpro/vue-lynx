/**
 * SPDX-License-Identifier: MIT
 *
 * Vendored from Huxpro/lynx-agent-spinners at commit
 * 45a6881a71a8d2467c88019a2ffebaa9dc970e15:
 * https://github.com/Huxpro/lynx-agent-spinners/blob/45a6881a71a8d2467c88019a2ffebaa9dc970e15/src/data/dots2.ts
 */
export interface SpinnerDefinition {
  readonly name: string;
  readonly frames: readonly string[];
  readonly interval: number;
  readonly category: 'braille' | 'ascii' | 'arrows' | 'emoji';
}

export const dots2: SpinnerDefinition = {
  name: 'dots2',
  frames: ['⣾', '⣽', '⣻', '⢿', '⡿', '⣟', '⣯', '⣷'],
  interval: 80,
  category: 'braille',
};
