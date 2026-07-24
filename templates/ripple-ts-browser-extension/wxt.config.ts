import { ripple } from '@ripple-ts/vite-plugin'
import { defineConfig } from 'wxt'

export default defineConfig({
	modules: ['@wxt-dev/auto-icons'],
	autoIcons: {
		baseIconPath: 'assets/icon.svg',
	},
	manifest: {
		name: 'Ripple Extension',
		description:
			'A production-shaped MV3 extension template built with Ripple TS and WXT.',
		permissions: ['storage'],
		action: {
			default_title: 'Open Ripple Extension',
		},
	},
	// Branded Chrome removed command-line extension sideloading. WXT still owns
	// compilation and HMR; the repository-owned Chrome launcher opens a stable
	// system profile where developers load the unpacked output once.
	webExt: {
		disabled: true,
	},
	vite: () => ({
		plugins: [ripple()],
	}),
})
