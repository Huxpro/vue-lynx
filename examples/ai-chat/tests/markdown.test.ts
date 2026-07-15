import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { parseMarkdown } from '../src/lib/markdown';

describe('parseMarkdown tables', () => {
  it('parses alignment, inline tokens, escaped pipes, and normalized rows', () => {
    const blocks = parseMarkdown(`| Name | Score | Notes |
| :--- | ---: | :---: |
| **Ada** | 10 | \`great\` |
| Grace | 9 | escaped \\| pipe |
| Linus | 8 |
| Extra | 7 | ok | ignored |`);

    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toEqual({
      type: 'table',
      headers: [
        [{ type: 'text', text: 'Name' }],
        [{ type: 'text', text: 'Score' }],
        [{ type: 'text', text: 'Notes' }],
      ],
      alignments: ['left', 'right', 'center'],
      rows: [
        [
          [{ type: 'bold', text: 'Ada' }],
          [{ type: 'text', text: '10' }],
          [{ type: 'code', text: 'great' }],
        ],
        [
          [{ type: 'text', text: 'Grace' }],
          [{ type: 'text', text: '9' }],
          [{ type: 'text', text: 'escaped | pipe' }],
        ],
        [
          [{ type: 'text', text: 'Linus' }],
          [{ type: 'text', text: '8' }],
          [],
        ],
        [
          [{ type: 'text', text: 'Extra' }],
          [{ type: 'text', text: '7' }],
          [{ type: 'text', text: 'ok' }],
        ],
      ],
    });
  });

  it('does not split pipes inside inline code', () => {
    const [table] = parseMarkdown(`Command | Meaning
--- | ---
\`a | b\` | pipeline`);

    expect(table).toMatchObject({
      type: 'table',
      rows: [[[{
        type: 'code',
        text: 'a | b',
      }], [{ type: 'text', text: 'pipeline' }]]],
    });
  });

  it('keeps malformed and incomplete table syntax as paragraphs', () => {
    expect(parseMarkdown('| A | B |\n| -- | nope |')).toEqual([
      {
        type: 'p',
        inline: [{ type: 'text', text: '| A | B | | -- | nope |' }],
      },
    ]);
    expect(parseMarkdown('| A | B |\n| --- |')).toEqual([
      {
        type: 'p',
        inline: [{ type: 'text', text: '| A | B | | --- |' }],
      },
    ]);
  });
});

describe('MarkdownView table rendering', () => {
  it('contains a native horizontally scrollable table branch', async () => {
    const source = await readFile(
      path.resolve(import.meta.dirname, '../src/components/chat/MarkdownView.vue'),
      'utf8',
    );

    expect(source).toContain("block.type === 'table'");
    expect(source).toContain('class="md-table-scroll w-full"');
    expect(source).toContain('alignmentStyle(block.alignments[ci])');
  });
});
