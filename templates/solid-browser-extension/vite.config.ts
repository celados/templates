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
		jsPlugins: ['eslint-plugin-solid'],
		ignorePatterns: ['.output', '.wxt'],
		settings: solid.settings,
		rules: {
			...solid.rules,
			// Formatting preferences, not reactivity rules.
			'solid/self-closing-comp': 'off',
			'solid/style-prop': 'off',
			'solid/prefer-structured-class': 'off',
		},
	},
	fmt: {
		...oxfmtConfig,
		ignorePatterns: [...oxfmtConfig.ignorePatterns, '.output', '.wxt'],
	},
})
