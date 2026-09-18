import { defineConfig } from 'vite-plus'

import { frameworkLintBase } from './tooling/lint'
import { oxfmtConfig } from './tooling/oxfmt'

const config = defineConfig({
	lint: {
		...frameworkLintBase,
		plugins: ['react'],
		jsPlugins: ['@convex-dev/eslint-plugin'],
		ignorePatterns: ['**/*.gen.ts', 'convex/_generated', 'dist'],
		rules: {
			// React's own correctness rules; built into Oxlint, no extra dependency.
			'react/rules-of-hooks': 'error',
			'react/exhaustive-deps': 'error',
			'react/jsx-key': 'error',
			'@convex-dev/no-old-registered-function-syntax': 'error',
			'@convex-dev/require-args-validator': 'error',
			'@convex-dev/explicit-table-ids': 'error',
			'@convex-dev/no-filter-in-query': 'error',
			'@convex-dev/no-top-of-hour-crons': 'error',
			'@convex-dev/no-schema-import-cycle': 'error',
			'@convex-dev/no-duplicate-indexes': 'error',
		},
	},
	staged: {
		'*': 'vp check --fix',
	},
	fmt: {
		...oxfmtConfig,
		sortTailwindcss: {
			stylesheet: 'web/src/styles.css',
			functions: ['cn', 'cx', 'cva'],
		},
	},
})

export default config
