import { defineConfig } from 'vite-plus'

export default defineConfig({
	test: {
		include: ['tooling/**/*.test.ts'],
	},
})
