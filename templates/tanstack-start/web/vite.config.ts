import { cloudflare } from '@cloudflare/vite-plugin'
import tailwindcss from '@tailwindcss/vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import { defineConfig, lazyPlugins } from 'vite-plus'

const config = defineConfig({
	root: import.meta.dirname,
	// Convex and the web runtime share deployment URLs from the project root.
	envDir: '..',
	resolve: { tsconfigPaths: true },
	ssr: {
		// Better Auth ships server code that Start must transform for the Workers runtime.
		// Source: https://labs.convex.dev/better-auth/framework-guides/tanstack-start
		noExternal: ['@convex-dev/better-auth'],
	},
	plugins: lazyPlugins(() => [
		// Cloudflare must own Start's SSR environment so development and builds
		// execute against the Workers runtime: https://developers.cloudflare.com/workers/vite-plugin/reference/vite-environments/
		cloudflare({ viteEnvironment: { name: 'ssr' } }),
		devtools(),
		tailwindcss(),
		tanstackStart({
			router: {
				generatedRouteTree: 'route-tree.gen.ts',
			},
		}),
		viteReact(),
	]),
})

export default config
