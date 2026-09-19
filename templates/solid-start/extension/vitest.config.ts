import solid from '@solidjs/vite-plugin'
import stylex from '@stylexjs/unplugin'
import { defineConfig } from 'vite-plus'
import { WxtVitest } from 'wxt/testing/vitest-plugin'

import { stylexOptions } from './stylex.config.ts'

export default defineConfig({
	// WxtVitest does not apply wxt.config.ts's Vite plugins. Solid's compiles JSX
	// and makes tests load Solid's browser build instead of its server build.
	plugins: [WxtVitest(), stylex.vite(stylexOptions), solid()],
	test: {
		clearMocks: true,
		// With the StyleX plugin loaded, Vitest waits out the close timeout on a
		// handle it leaves open; exit status is unaffected. Same as web/.
		teardownTimeout: 1000,
	},
})
