import { defineConfig } from 'vite-plus'

import { frameworkLintBase } from './tooling/lint'
import { solidLint } from './tooling/lint-solid'
import { oxfmtConfig } from './tooling/oxfmt'

// The extension has its own package.json for WXT, but one lint and format
// policy covers the whole project; only its build output is excluded.
const extensionGenerated = [
	'extension/.output',
	'extension/.wxt',
	'extension/.chrome-profile',
]

export default defineConfig({
	staged: {
		'*': 'vp check --fix',
	},
	lint: {
		...frameworkLintBase,
		jsPlugins: [
			solidLint.plugin,
			'@convex-dev/eslint-plugin',
			'@stylexjs/eslint-plugin',
		],
		ignorePatterns: [
			'dist',
			'convex/_generated',
			'*.d.ts',
			...extensionGenerated,
		],
		settings: solidLint.settings,
		rules: {
			...solidLint.rules,
			'@convex-dev/no-old-registered-function-syntax': 'error',
			'@convex-dev/require-args-validator': 'error',
			'@convex-dev/explicit-table-ids': 'error',
			'@convex-dev/no-filter-in-query': 'error',
			'@convex-dev/no-top-of-hour-crons': 'error',
			'@convex-dev/no-schema-import-cycle': 'error',
			'@convex-dev/no-duplicate-indexes': 'error',
			// valid-styles and valid-shorthands stay off: their 0.19 value tables reject
			// styles the compiler accepts (`flex: 1`, `scrollSnapType: 'y proximity'`).
			'@stylexjs/enforce-extension': 'error',
			'@stylexjs/no-unused': 'error',
			'@stylexjs/no-conflicting-props': 'error',
			'@stylexjs/no-legacy-contextual-styles': 'error',
			'@stylexjs/no-lookahead-selectors': 'error',
		},
	},
	fmt: {
		...oxfmtConfig,
		// Solid start mode regenerates these on every dev and build start.
		ignorePatterns: [
			...oxfmtConfig.ignorePatterns,
			'web/file-routes.d.ts',
			'web/solid-env.d.ts',
			...extensionGenerated,
		],
	},
})
