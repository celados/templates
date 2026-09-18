import solid from '@solidjs/vite-plugin'
import { defineConfig } from 'wxt'

export default defineConfig({
	modules: ['@wxt-dev/auto-icons'],
	autoIcons: {
		baseIconPath: 'assets/icon.svg',
	},
	manifest: {
		name: 'Solid Extension',
		description:
			'A production-shaped MV3 extension template built with Solid 2 and WXT.',
		permissions: ['storage'],
		action: {
			default_title: 'Open Solid Extension',
		},
	},
	// Branded Chrome removed command-line extension sideloading. WXT still owns
	// compilation and HMR; the repository-owned Chrome launcher opens a stable
	// system profile and loads the unpacked output over CDP.
	webExt: {
		disabled: true,
	},
	vite: () => ({
		// Client-only renderer: extension pages and content scripts never SSR.
		plugins: [solid()],
		// Two copies of the Solid runtime break context and ownership lookups.
		resolve: { dedupe: ['solid-js', '@solidjs/web'] },
	}),
})
