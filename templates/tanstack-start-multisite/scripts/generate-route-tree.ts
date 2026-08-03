import { Generator, getConfig } from '@tanstack/router-generator'

const site = process.argv[2]
if (site !== 'alpha' && site !== 'beta') {
	throw new Error('Site must be alpha or beta.')
}

const root = process.cwd()
const siteRoot = `./sites/${site}`
const config = getConfig(
	{
		generatedRouteTree: `${siteRoot}/src/route-tree.gen.ts`,
		routesDirectory: `${siteRoot}/src/routes`,
	},
	root,
)

await new Generator({ config, root }).run()
