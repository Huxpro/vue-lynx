import { defineConfig } from '@rslib/core';

export default defineConfig({
  lib: [
    // Unbundled ESM – webpack imports entry-main.ts as a regular module
    // on the main-thread layer. The old flat-bundle build is no longer needed
    // since VueMarkMainThreadPlugin no longer replaces webpack-generated content.
    {
      format: 'esm',
      // Must not exceed es2019: the LEPUS bytecode compiler (which compiles
      // main-thread JS to bytecode) does not support ES2020+ syntax such as
      // optional chaining (?.) and nullish coalescing (??). Pre-transpiling
      // here ensures the dist files are LEPUS-compatible regardless of
      // whether the downstream app build's SWC pass processes them.
      syntax: 'es2019',
      bundle: false,
      dts: true,
    },
  ],
  source: {
    tsconfigPath: './tsconfig.build.json',
  },
  output: {
    distPath: { root: 'dist' },
  },
});
