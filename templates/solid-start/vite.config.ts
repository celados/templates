import solid from 'eslint-plugin-solid/configs/v2'
import { defineConfig } from 'vite-plus'

import { frameworkLintBase } from './tooling/lint'
import { oxfmtConfig } from './tooling/oxfmt'

export default defineConfig({
	staged: {
		'*': 'vp check --fix',
	},
	lint: {
		...frameworkLintBase,
		jsPlugins: [
			'eslint-plugin-solid',
			'@convex-dev/eslint-plugin',
			'@stylexjs/eslint-plugin',
		],
		ignorePatterns: ['dist', 'convex/_generated', '*.d.ts'],
		settings: solid.settings,
		rules: {
			...solid.rules,
			// Formatting preferences, not reactivity rules.
			'solid/self-closing-comp': 'off',
			'solid/style-prop': 'off',
			'solid/prefer-structured-class': 'off',
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
		],
	},
})
