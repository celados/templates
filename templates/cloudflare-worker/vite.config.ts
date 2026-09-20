import { defineConfig } from 'vite-plus'

import { oxfmtConfig } from './tooling/oxfmt'

export default defineConfig({
	check: {
		lint: false,
	},
	staged: {
		'*': 'vp check --fix',
	},
	// Worker, auth, and database modules reach each other through `@/*`; vitest
	// and the dev server need the tsconfig paths that wrangler's bundler reads.
	resolve: { tsconfigPaths: true },
	lint: {
		ignorePatterns: [
			'dist',
			'.wrangler',
			'src/worker-configuration.d.ts',
			'drizzle',
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
			'src/worker-configuration.d.ts',
			'drizzle',
		],
	},
	test: {
		include: ['src/**/*.test.ts', 'packages/**/*.test.ts'],
		environment: 'node',
	},
})
