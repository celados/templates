import { defineConfig } from 'vite-plus'

import { oxfmtConfig } from './tooling/oxfmt'

export default defineConfig({
	check: {
		lint: false,
	},
	staged: {
		'*': 'vp check --fix',
	},
	lint: {
		ignorePatterns: [
			'dist',
			'.wrangler',
			'apps/worker/src/worker-configuration.d.ts',
			'packages/db/drizzle',
		],
		options: {
			typeAware: true,
			typeCheck: true,
		},
	},
	fmt: {
		...oxfmtConfig,
		ignorePatterns: [
			...(oxfmtConfig.ignorePatterns ?? []),
			'apps/worker/src/worker-configuration.d.ts',
			'packages/db/drizzle',
		],
	},
	test: {
		include: ['apps/**/*.test.ts', 'packages/**/*.test.ts'],
		environment: 'node',
	},
})
