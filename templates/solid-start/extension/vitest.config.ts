import { defineConfig } from 'vite-plus'
import { WxtVitest } from 'wxt/testing/vitest-plugin'

export default defineConfig({
	plugins: [WxtVitest()],
	// Tests run in Vitest's server environment, which would otherwise load
	// Solid's server build, and ../web modules would bring the root's copy.
	resolve: { dedupe: ['solid-js', '@solidjs/web'] },
	ssr: { resolve: { conditions: ['browser'] } },
	test: {
		clearMocks: true,
	},
})
