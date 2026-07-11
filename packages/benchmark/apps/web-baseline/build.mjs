// Build the three plain-DOM baseline bundles with esbuild.
// The .vue vapor SFC is compiled with @vue/compiler-sfc exactly like the
// vue-lynx plugin does (inlineTemplate, vapor auto-detected from the
// descriptor); compiled output imports helpers from 'vue' (3.6 exports the
// vapor helper surface).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { compileScript, parse } from '@vue/compiler-sfc';

const root = path.dirname(fileURLToPath(import.meta.url));

const vaporSfcPlugin = {
  name: 'vapor-sfc',
  setup(b) {
    b.onLoad({ filter: /\.vue$/ }, (args) => {
      const source = fs.readFileSync(args.path, 'utf-8');
      const { descriptor, errors } = parse(source, { filename: args.path });
      if (errors.length) throw new Error(errors.map(String).join('\n'));
      const result = compileScript(descriptor, {
        id: path.basename(args.path).replace(/\W/g, ''),
        inlineTemplate: true,
      });
      return { contents: result.content, loader: 'js', resolveDir: path.dirname(args.path) };
    });
  },
};

const targets = [
  { entry: 'src/preact-app.jsx', out: 'dist/preact.js', jsx: true },
  { entry: 'src/vue-app.js', out: 'dist/vue.js' },
  { entry: 'src/vapor-main.js', out: 'dist/vapor.js' },
];

for (const t of targets) {
  await build({
    entryPoints: [path.join(root, t.entry)],
    outfile: path.join(root, t.out),
    bundle: true,
    format: 'iife',
    minify: true,
    define: {
      'process.env.NODE_ENV': '"production"',
      __VUE_OPTIONS_API__: 'true',
      __VUE_PROD_DEVTOOLS__: 'false',
      __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'false',
    },
    alias: {
      // vue-app uses runtime template compilation → full build
      vue: t.entry.includes('vue-app')
        ? 'vue/dist/vue.esm-bundler.js'
        : 'vue',
    },
    jsx: t.jsx ? 'automatic' : undefined,
    jsxImportSource: t.jsx ? 'preact' : undefined,
    plugins: [vaporSfcPlugin],
    logLevel: 'warning',
  });
  console.log('built', t.out);
}
