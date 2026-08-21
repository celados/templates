import { cloudflare } from '@cloudflare/vite-plugin'
import mdx from '@mdx-js/rollup'
import tailwindcss from '@tailwindcss/vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'
import remarkFrontmatter from 'remark-frontmatter'
import remarkGfm from 'remark-gfm'
import remarkMdxFrontmatter from 'remark-mdx-frontmatter'
import { searchForWorkspaceRoot } from 'vite'
import { imagetools } from 'vite-imagetools'
import { defineConfig, lazyPlugins, loadEnv } from 'vite-plus'

import { oxfmtConfig } from './tooling/oxfmt'
import { createContentPages } from './tooling/ssg-content'

const calqueStateRoot = process.env.CALQUE_STATE_HOME
	? resolve(process.env.CALQUE_STATE_HOME)
	: join(
			process.env.XDG_STATE_HOME
				? resolve(process.env.XDG_STATE_HOME)
				: join(homedir(), '.local', 'state'),
			'calque',
		)

function contentMdx() {
	return {
		...mdx({
			include: [/\/content\/.*\.mdx?$/],
			remarkPlugins: [remarkGfm, remarkFrontmatter, remarkMdxFrontmatter],
		}),
		// Rolldown's builtin parser must see JavaScript, not the original MDX source.
		enforce: 'pre' as const,
	}
}

const config = defineConfig((configEnv) => {
	const env = loadEnv(configEnv.mode, process.cwd(), '')
	const siteUrl = env.VITE_SITE_URL || 'https://example.com'
	const buildDate =
		env.CONTENT_BUILD_DATE || new Date().toISOString().slice(0, 10)
	const contentPages = createContentPages(process.cwd(), buildDate)

	return {
		check: {
			lint: false,
		},
		staged: {
			'*': 'vp check --fix',
		},
		fmt: oxfmtConfig,
		resolve: { tsconfigPaths: true },
		define: {
			// Worker clocks can differ during prerender; one cutoff keeps discovery and runtime routing identical.
			__CONTENT_BUILD_DATE__: JSON.stringify(buildDate),
		},
		build: {
			// Static hosts need real responsive-image artifacts, not build-size-dependent data URLs.
			assetsInlineLimit: 0,
		},
		server: {
			// Calque projections are symlinked from its state directory during clone runs.
			fs: {
				allow: [searchForWorkspaceRoot(process.cwd()), calqueStateRoot],
			},
		},
		plugins: lazyPlugins(() => [
			devtools(),
			cloudflare({ viteEnvironment: { name: 'ssr' } }),
			tailwindcss(),
			imagetools(),
			contentMdx(),
			tanstackStart({
				importProtection: { behavior: 'error' },
				pages: [
					...contentPages,
					{
						path: '/rss.xml',
						prerender: { outputPath: '/rss.xml', crawlLinks: false },
						sitemap: { exclude: true },
					},
					{
						path: '/robots.txt',
						prerender: { outputPath: '/robots.txt', crawlLinks: false },
						sitemap: { exclude: true },
					},
				],
				prerender: {
					enabled: true,
					autoStaticPathsDiscovery: true,
					crawlLinks: true,
					failOnError: true,
					maxRedirects: 5,
					retryCount: 1,
				},
				router: {
					generatedRouteTree: 'route-tree.gen.ts',
				},
				sitemap: { enabled: true, host: siteUrl },
			}),
			viteReact({ include: /\.(?:js|jsx|md|mdx|ts|tsx)$/ }),
		]),
	}
})

export default config
