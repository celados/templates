import { defineConfig } from 'vite-plus'

import { oxfmtConfig } from './tooling/oxfmt'

export default defineConfig({
	check: {
		lint: false,
	},
	staged: {
		'*': 'vp check --fix',
	},
	lint: {
		ignorePatterns: ['dist', '.astro'],
		options: {
			typeAware: true,
			typeCheck: true,
		},
	},
	fmt: {
		...oxfmtConfig,
		sortTailwindcss: {
			stylesheet: 'src/styles/global.css',
			functions: ['cn', 'cx', 'clsx', 'cva'],
		},
	},
})
