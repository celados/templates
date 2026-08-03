import { createSiteViteConfig } from '../../tooling/create-site-vite-config'

const config = createSiteViteConfig({
	siteId: 'beta',
	siteRoot: import.meta.dirname,
})

export default config
