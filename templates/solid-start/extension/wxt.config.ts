import solid from '@solidjs/vite-plugin'
import stylex from '@stylexjs/unplugin'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'wxt'

import { stylexExtensionPageDev, stylexOptions } from './stylex.config.ts'

// Convex writes VITE_CONVEX_URL to the project root's .env.local, but WXT reads
// dotenv files only from this directory. Variables already set (CI) win.
const rootEnv = fileURLToPath(new URL('../.env.local', import.meta.url))
if (existsSync(rootEnv)) process.loadEnvFile(rootEnv)
// The web app's origin; the default matches its `vp dev` port. Set before
// Vite loads the environment so the runtime and the manifest agree.
process.env.WXT_SITE_URL ??= 'http://localhost:3000'

export default defineConfig({
	modules: ['@wxt-dev/auto-icons', '@wxt-dev/i18n/module'],
	autoIcons: {
		baseIconPath: 'assets/icon.svg',
	},
	// Function form: WXT resolves it after the environment is loaded.
	manifest: () => ({
		// Resolved by Chrome from locales/*.yml, which @wxt-dev/i18n compiles
		// into _locales/<lang>/messages.json.
		default_locale: 'en',
		name: '__MSG_extName__',
		description: '__MSG_extDescription__',
		// cookies: sign-in and sign-out on the web app reach open extension pages.
		permissions: ['cookies', 'storage'],
		// The web app only: requests there carry its session cookie to mint
		// Convex tokens, without CORS. Convex itself needs no host permission.
		host_permissions: [siteMatchPattern(process.env.WXT_SITE_URL!)],
		action: {
			default_title: '__MSG_actionTitle__',
		},
	}),
	// Branded Chrome removed command-line extension sideloading. WXT still owns
	// compilation and HMR; the repository-owned Chrome launcher opens a stable
	// system profile and loads the unpacked output over CDP.
	webExt: {
		disabled: true,
	},
	// WXT otherwise takes the first free port from 3000, which the web app's
	// `vp dev --strictPort` needs.
	dev: { server: { port: 3001 } },
	vite: () => ({
		// The StyleX compiler must see source before the Solid JSX transform.
		// Solid runs client-only: extension pages and content scripts never SSR.
		plugins: [stylex.vite(stylexOptions), stylexExtensionPageDev(), solid()],
		// Two copies of the Solid runtime break context and ownership lookups.
		// Modules imported from ../web resolve from the root node_modules, so
		// this also requires both package.json files to pin the same versions.
		resolve: { dedupe: ['solid-js', '@solidjs/web'] },
		// The extension imports ../convex/_generated, ../web/src/lib and
		// ../web/src/styles.
		server: { fs: { allow: ['..'] } },
	}),
})

// Cookies have no port, so the cookies API checks access against the
// port-less URL; a pattern pinned to the dev port (localhost:3000) would hide
// the session cookie and its change events. Without a port, a pattern matches
// every port of that host.
function siteMatchPattern(site: string): string {
	const url = new URL(site)
	return `${url.protocol}//${url.hostname}/*`
}
