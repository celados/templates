import { defineConfig } from 'vite-plus'

import { frameworkLintBase } from './tooling/lint'
import { solidLint } from './tooling/lint-solid'
import { oxfmtConfig } from './tooling/oxfmt'

export default defineConfig({
	staged: {
		'*': 'vp check --fix',
	},
	lint: {
		...frameworkLintBase,
		jsPlugins: [solidLint.plugin],
		ignorePatterns: ['.output', '.wxt'],
		settings: solidLint.settings,
		rules: {
			...solidLint.rules,
		},
	},
	fmt: {
		...oxfmtConfig,
		ignorePatterns: [...oxfmtConfig.ignorePatterns, '.output', '.wxt'],
	},
})
