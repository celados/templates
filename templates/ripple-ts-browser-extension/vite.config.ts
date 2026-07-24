import { defineConfig } from 'vite-plus'

import { oxfmtConfig } from './tooling/oxfmt'

const config = defineConfig({
	staged: {
		'*': 'vp check --fix',
	},
	fmt: {
		...oxfmtConfig,
		// TSRX owns its parser; tsrx-tsc is the authoritative source check.
		ignorePatterns: [...oxfmtConfig.ignorePatterns, '**/*.tsrx'],
	},
	lint: {
		ignorePatterns: ['.output/**', '.wxt/**', '**/*.tsrx'],
		options: {
			typeAware: true,
			typeCheck: true,
		},
	},
})

export default config
