import { defineConfig } from '@lynx-js/rspeedy';
import { pluginOctane } from '@octanejs/rspeedy-plugin';

const autoRows = Number(process.env.BENCH_AUTOROWS ?? '0') || 0;
const autoSuffix = autoRows > 0 ? `-rows${autoRows}` : '';

export default defineConfig(({ command }) => {
	const development = command === 'dev';

	return {
		mode: development ? 'development' : 'production',
		environments: {
			lynx: {},
			web: {},
		},
		output: {
			cleanDistPath: true,
			filename: {
				bundle: '[name].[platform].bundle',
			},
			filenameHash: false,
			distPath: { root: 'dist' + autoSuffix },
		},
		source: {
			entry: {
				main: './src/index.ts',
			},
			define: {
				__BENCH_AUTOROWS__: JSON.stringify(autoRows),
			},
		},
		splitChunks: false,
		plugins: [pluginOctane({ dev: development, hmr: development })],
	};
});
