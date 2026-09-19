import { defineConfig } from 'vite-plus'
import { WxtVitest } from 'wxt/testing/vitest-plugin'

export default defineConfig({
	plugins: [WxtVitest()],
	test: {
		clearMocks: true,
	},
})
