import { defineConfig } from '@playwright/test'

export default defineConfig({
	testDir: './e2e',
	use: {
		baseURL: 'http://127.0.0.1:4173',
		channel: 'chrome',
	},
	webServer: {
		command: 'bun scripts/serve-static.ts',
		port: 4173,
		reuseExistingServer: false,
	},
})
