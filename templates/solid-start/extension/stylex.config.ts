import type { Plugin } from 'vite'

import stylex from '@stylexjs/unplugin'
import { fileURLToPath } from 'node:url'

// Shared by wxt.config.ts and vitest.config.ts: components call stylex.create,
// which throws at runtime unless the compiler rewrote the module. Same layers
// and module root as web/vite.config.ts, so tokens imported from
// web/src/styles compile to the same variable names in both builds.
export const stylexOptions: Parameters<typeof stylex.vite>[0] = {
	useCSSLayers: { before: ['reset'], prefix: 'stylex' },
	unstable_moduleResolution: {
		type: 'commonJS',
		rootDir: fileURLToPath(new URL('..', import.meta.url)),
	},
}

const SHIM = 'virtual:stylex-extension-page'

/**
 * StyleX serves dev CSS from `/virtual:stylex.css` and injects root-relative
 * tags for it, which an extension page resolves against `chrome-extension://`
 * instead of the dev server, leaving `wxt dev` pages unstyled. This swaps them
 * for a module loaded from the dev server that fetches the CSS from its own
 * origin (the dev manifest grants the page host access to it) and refetches on
 * the events StyleX's own runtime listens to. Builds and content scripts are
 * unaffected: their CSS is bundled.
 */
export function stylexExtensionPageDev(): Plugin {
	let origin = ''
	return {
		name: 'stylex-extension-page-dev',
		apply: 'serve',
		configureServer(server) {
			origin = server.config.server.origin ?? ''
		},
		resolveId: (id) => (id === SHIM ? `\0${SHIM}` : undefined),
		load: (id) =>
			id === `\0${SHIM}`
				? // Concatenated: Vite rewrites `new URL(path, import.meta.url)` as an asset.
					`const url = new URL(import.meta.url).origin + '/virtual:stylex.css'
const style = document.head.appendChild(document.createElement('style'))
async function update() {
	style.textContent = await (await fetch(url, { cache: 'no-store' })).text()
}
update()
if (import.meta.hot) {
	import.meta.hot.on('stylex:css-update', update)
	// StyleX's runtime waits the same 180 ms for recompiled rules.
	import.meta.hot.on('vite:afterUpdate', () => setTimeout(update, 180))
}`
				: undefined,
		transformIndexHtml: {
			// After StyleX has added its tags.
			order: 'post',
			handler: (html) =>
				html
					.replace(/\s*<link[^>]*virtual:stylex\.css[^>]*>/u, '')
					.replace(
						/<script[^>]*virtual:stylex:runtime[^>]*><\/script>/u,
						`<script type="module" src="${origin}/@id/${SHIM}"></script>`,
					),
		},
	}
}
