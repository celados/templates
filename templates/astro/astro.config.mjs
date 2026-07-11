// @ts-check

import markdoc from '@astrojs/markdoc'
import react from '@astrojs/react'
import keystatic from '@keystatic/astro'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'astro/config'

// Local storage needs Node.js filesystem access, so the static production build
// omits Keystatic's server routes: https://keystatic.com/docs/recipes/astro-disable-admin-ui-in-production
const shouldMountKeystatic = process.env.SKIP_KEYSTATIC !== 'true'

// https://astro.build/config
export default defineConfig({
	vite: {
		plugins: [tailwindcss()],
	},
	integrations: [
		react(),
		markdoc(),
		...(shouldMountKeystatic ? [keystatic()] : []),
	],
})
