import { defineConfig } from 'vite-plus'

import { oxfmtConfig } from './tooling/oxfmt'

const config = defineConfig({
	check: {
		lint: false,
	},
	staged: {
		'*': 'vp check --fix',
	},
	lint: {
		ignorePatterns: ['.output/**', '.wxt/**', '**/*.tsrx'],
		options: {
			typeAware: true,
			typeCheck: true,
		},
	},
	fmt: {
		...oxfmtConfig,
		// TSRX owns its parser; tsrx-tsc is the authoritative source check.
		ignorePatterns: [...oxfmtConfig.ignorePatterns, '**/*.tsrx'],
	},
})

export default config
