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
		ignorePatterns: [
			'web/src/route-tree.gen.ts',
			'web/src/worker-configuration.d.ts',
		],
		options: {
			typeAware: false,
			// Runtime scopes own their typechecks; the root check owns formatting.
			typeCheck: false,
		},
	},
	fmt: {
		...oxfmtConfig,
		sortTailwindcss: {
			stylesheet: 'web/src/styles.css',
			functions: ['cn', 'cx', 'clsx', 'cva'],
		},
	},
})

export default config
