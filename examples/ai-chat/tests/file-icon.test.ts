import { describe, expect, it } from 'vitest';

import { fileIcon } from '../src/lib/file-icon';

describe('fileIcon', () => {
  it('uses a spreadsheet glyph for CSV and Excel files', () => {
    expect(fileIcon('text/csv', 'report.csv')).toBe('i-lucide-file-spreadsheet');
    expect(fileIcon('application/vnd.ms-excel', 'report.xls')).toBe(
      'i-lucide-file-spreadsheet',
    );
  });

  it('uses a document glyph for PDF, text, and Word files', () => {
    expect(fileIcon('application/pdf', 'report.pdf')).toBe('i-lucide-file-text');
    expect(fileIcon('text/plain', 'notes.txt')).toBe('i-lucide-file-text');
    expect(fileIcon('application/msword', 'draft.doc')).toBe('i-lucide-file-text');
  });

  it('falls back to the generic file glyph', () => {
    expect(fileIcon('application/octet-stream', 'data.bin')).toBe('i-lucide-file');
  });
});
