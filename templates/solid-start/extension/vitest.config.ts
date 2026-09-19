import solid from '@solidjs/vite-plugin'
import { defineConfig } from 'vite-plus'
import { WxtVitest } from 'wxt/testing/vitest-plugin'

export default defineConfig({
	// WxtVitest does not apply wxt.config.ts's Vite plugins. Solid's compiles JSX
	// and makes tests load Solid's browser build instead of its server build.
	plugins: [WxtVitest(), solid()],
	test: {
		clearMocks: true,
	},
})
