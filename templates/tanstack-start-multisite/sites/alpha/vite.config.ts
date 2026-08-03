import { createSiteViteConfig } from '../../tooling/create-site-vite-config'

const config = createSiteViteConfig({
	siteId: 'alpha',
	siteRoot: import.meta.dirname,
})

export default config
