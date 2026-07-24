import { ripple } from '@ripple-ts/vite-plugin'
import { defineConfig } from 'vite-plus'

const config = defineConfig({
	build: {
		target: 'esnext',
	},
	plugins: ripple(),
})

export default config
