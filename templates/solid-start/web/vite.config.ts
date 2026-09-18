import { cloudflare } from '@cloudflare/vite-plugin'
import solid from '@solidjs/vite-plugin'
import stylex from '@stylexjs/unplugin'
import { fileRoutes } from 'filesystem-routing/vite'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite-plus'

// Vitest injects Node externals into the SSR environment, which Cloudflare
// intentionally rejects. Component tests need the Solid transform, not workerd.
const enableCloudflare = process.env.VITEST !== 'true'
const SOLID = ['solid-js', '@solidjs/web', '@solidjs/router', '@solidjs/meta']

export default defineConfig({
	root: fileURLToPath(new URL('.', import.meta.url)),
	envDir: '..',
	cacheDir: '../node_modules/.vite',
	plugins: [
		// Cloudflare must adopt the SSR environment before Solid installs its
		// generated Worker entry. This keeps dev, build, and deploy in workerd.
		...(enableCloudflare
			? [cloudflare({ viteEnvironment: { name: 'ssr' } })]
			: []),
		// The StyleX compiler must see source before the Solid JSX transform.
		stylex.vite({
			// Unlayered CSS beats every layer, so the reset declares its own layer
			// and StyleX orders it first; otherwise `button { color: inherit }`
			// would override component styles.
			useCSSLayers: { before: ['reset'], prefix: 'stylex' },
			unstable_moduleResolution: {
				type: 'commonJS',
				rootDir: fileURLToPath(new URL('..', import.meta.url)),
			},
		}),
		solid({
			start: {
				app: './src/app.tsx',
				document: './src/document.tsx',
				middleware: './src/middleware.ts',
			},
			ssr: true,
			extensions: ['.jsx', '.tsx'],
		}),
		// Eager routes until lazy hydration is verified for the application.
		fileRoutes({ types: true, httpMethods: true, codeSplitting: false }),
	],
	resolve: { dedupe: ['solid-js', '@solidjs/web'] },
	// A pre-bundled copy of the Solid runtime next to the source one makes
	// context lookups fail with NoOwnerError during SSR; keep Solid out of the
	// optimizer in both environments.
	optimizeDeps: { exclude: SOLID },
	ssr: { optimizeDeps: { exclude: SOLID } },
	test: {
		globals: false,
		setupFiles: ['./vitest-setup.ts'],
		environment: 'jsdom',
		include: ['src/**/*.test.tsx'],
		// The native @solidjs/compiler binding leaves a GC handle open, so Vitest
		// always waits out the close timeout; exit status is unaffected.
		teardownTimeout: 1000,
	},
	build: { target: 'esnext' },
})
