import { defineConfig } from 'vite-plus'

import { oxfmtConfig } from './tooling/oxfmt'

export default defineConfig({
	check: {
		lint: false,
	},
	staged: {
		'*': 'vp check --fix',
	},
	fmt: {
		...oxfmtConfig,
		// Solid start mode regenerates these on every dev and build start.
		ignorePatterns: [
			...oxfmtConfig.ignorePatterns,
			'web/file-routes.d.ts',
			'web/solid-env.d.ts',
		],
	},
})
