import { defineConfig } from '@rslib/core';

export default defineConfig({
  lib: [{ 
    format: 'esm', 
    syntax: 'es2022', 
    bundle: true, 
    dts: true,
  }],
  source: {
    tsconfigPath: './tsconfig.build.json',
    entry: { 
      'index': './src/index.ts',
    },
  },
  output: {
    distPath: { root: 'dist' }, 
    cleanDistPath: true,
    copy: ['./src/volar-plugin.cjs'],
  },
});
