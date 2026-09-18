import solidV2 from 'eslint-plugin-solid/configs/v2'
import { defineConfig } from 'oxlint'

// Vite+ lint stays off (template contract); this pass exists only for the
// Solid 2 reactivity rules that TypeScript cannot see.
export default defineConfig({
	jsPlugins: ['eslint-plugin-solid'],
	ignorePatterns: ['**/*.gen.*', 'dist'],
	settings: solidV2.settings,
	rules: solidV2.rules,
})
