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
		ignorePatterns: ['**/*.tsrx'],
		options: {
			typeAware: true,
			typeCheck: true,
		},
	},
	fmt: {
		...oxfmtConfig,
		// TSRX uses its own parser; tsrx-tsc remains the authoritative source check.
		ignorePatterns: [...oxfmtConfig.ignorePatterns, '**/*.tsrx'],
	},
})

export default config
