import { defineConfig } from 'vite-plus'

import { oxfmtConfig } from './tooling/oxfmt'

const config = defineConfig({
	staged: {
		'*': 'vp check --fix',
	},
	fmt: {
		...oxfmtConfig,
		// TSRX uses its own parser; tsrx-tsc remains the authoritative source check.
		ignorePatterns: [...oxfmtConfig.ignorePatterns, '**/*.tsrx'],
	},
	lint: {
		ignorePatterns: ['**/*.tsrx'],
		options: {
			typeAware: true,
			typeCheck: true,
		},
	},
})

export default config
