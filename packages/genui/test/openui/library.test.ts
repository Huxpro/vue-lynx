// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { describe, expect, test } from 'vitest';

import { createOpenUiLibrary } from '../../src/openui/core/createLibrary.js';
import { createStreamingParser } from '../../src/openui/core/index.js';

const BUILT_IN_COMPONENTS = [
  'Stack',
  'Row',
  'Column',
  'List',
  'Card',
  'CardHeader',
  'Text',
  'TextContent',
  'Separator',
  'Divider',
  'Button',
  'Buttons',
  'Tag',
  'Image',
  'Icon',
  'Video',
  'AudioPlayer',
  'Loading',
  'Tabs',
  'Modal',
  'CheckBox',
  'RadioGroup',
  'ChoicePicker',
  'Slider',
  'TextField',
  'DateTimeInput',
];

describe('createOpenUiLibrary', () => {
  test('registers every built-in component with Stack as root', () => {
    const library = createOpenUiLibrary();
    expect(library.root).toBe('Stack');
    for (const name of BUILT_IN_COMPONENTS) {
      expect(library.components[name], name).toBeDefined();
    }
  });

  test('parses a minimal scenario against the library schema', () => {
    const library = createOpenUiLibrary();
    const parser = createStreamingParser(library.toJSONSchema(), library.root);
    const result = parser.set(
      'root = Stack([TextContent("Hello Vue Lynx")])',
    );
    expect(result.root).not.toBeNull();
    expect(result.root?.typeName).toBe('Stack');
    expect(result.meta.errors).toEqual([]);
  });

  test('reports unknown components through the parse result', () => {
    const library = createOpenUiLibrary();
    const parser = createStreamingParser(library.toJSONSchema(), library.root);
    const result = parser.set('root = Unknown()');
    expect(result.root).toBeNull();
    expect(result.meta.errors[0]?.code).toBe('unknown-component');
  });

  test('supports custom roots and extra components', () => {
    const library = createOpenUiLibrary({ root: 'Column' });
    expect(library.root).toBe('Column');
  });
});
