import solid from '@solidjs/vite-plugin'
import { defineConfig } from 'wxt'

export default defineConfig({
	modules: ['@wxt-dev/auto-icons', '@wxt-dev/i18n/module'],
	autoIcons: {
		baseIconPath: 'assets/icon.svg',
	},
	manifest: {
		// Resolved by Chrome from locales/*.yml, which @wxt-dev/i18n compiles
		// into _locales/<lang>/messages.json.
		default_locale: 'en',
		name: '__MSG_extName__',
		description: '__MSG_extDescription__',
		permissions: ['storage'],
		action: {
			default_title: '__MSG_actionTitle__',
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
