import { defineConfig } from 'vite-plus'

import { oxfmtConfig } from './tooling/oxfmt'

export default defineConfig({
	staged: {
		'*': 'vp check --fix',
	},
	lint: {
		ignorePatterns: ['dist', '.astro'],
		options: {
			typeAware: true,
			typeCheck: true,
		},
		jsPlugins: [
			{
				name: 'vite-plus',
				specifier: 'vite-plus/oxlint-plugin',
			},
		],
		rules: {
			'vite-plus/prefer-vite-plus-imports': 'error',
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
