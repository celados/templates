import solidV2 from 'eslint-plugin-solid/configs/v2'
import { defineConfig } from 'vite-plus'

import { oxfmtConfig } from './tooling/oxfmt'

export default defineConfig({
	// `vp check` skips lint (template contract); `bun run lint` runs only the
	// Solid 2 reactivity rules that TypeScript cannot see.
	check: {
		lint: false,
	},
	lint: {
		jsPlugins: ['eslint-plugin-solid'],
		ignorePatterns: ['.output', '.wxt'],
		settings: solidV2.settings,
		rules: solidV2.rules,
	},
	staged: {
		'*': 'vp check --fix',
	},
	fmt: {
		...oxfmtConfig,
		ignorePatterns: [...oxfmtConfig.ignorePatterns, '.output', '.wxt'],
	},
})
