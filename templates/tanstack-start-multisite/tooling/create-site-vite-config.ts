import { cloudflare } from '@cloudflare/vite-plugin'
import tailwindcss from '@tailwindcss/vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import { resolve } from 'node:path'
import { defineConfig, lazyPlugins } from 'vite-plus'

import type { SiteId } from '../shared/site/site-config'

type SiteViteConfig = {
	siteId: SiteId
	siteRoot: string
}

export function createSiteViteConfig(options: SiteViteConfig) {
	const { siteId, siteRoot } = options
	const projectRoot = resolve(siteRoot, '../..')

	return defineConfig({
		root: siteRoot,
		envDir: projectRoot,
		cacheDir: resolve(projectRoot, `node_modules/.vite/${siteId}`),
		resolve: { tsconfigPaths: true },
		ssr: {
			// Better Auth ships server code that Start must transform for the Workers runtime.
			// Source: https://labs.convex.dev/better-auth/framework-guides/tanstack-start
			noExternal: ['@convex-dev/better-auth'],
		},
		plugins: lazyPlugins(() => [
			devtools(),
			cloudflare({
				configPath: resolve(siteRoot, 'wrangler.jsonc'),
				viteEnvironment: { name: 'ssr' },
			}),
			tailwindcss(),
			tanstackStart({
				// A site owns one Router and one generated tree; shared source is compiled
				// inside that site's TypeScript program instead of registering two routers.
				importProtection: { behavior: 'error' },
				router: { generatedRouteTree: 'route-tree.gen.ts' },
			}),
			viteReact(),
		]),
	})
}
