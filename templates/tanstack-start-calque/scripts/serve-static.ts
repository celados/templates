import { existsSync } from 'node:fs'
import { extname, resolve } from 'node:path'

const outputRoot = resolve(import.meta.dirname, '../dist/client')
const port = Number(process.env.PORT || 4173)

function resolveAsset(pathname: string) {
	const decodedPath = decodeURIComponent(pathname)
	if (decodedPath.includes('..')) return undefined
	const relativePath = decodedPath.replace(/^\/+/, '')
	return extname(relativePath)
		? resolve(outputRoot, relativePath)
		: resolve(outputRoot, relativePath, 'index.html')
}

Bun.serve({
	port,
	fetch(request) {
		const file = resolveAsset(new URL(request.url).pathname)
		if (file?.startsWith(outputRoot) && existsSync(file))
			return new Response(Bun.file(file))
		return new Response(Bun.file(resolve(outputRoot, '404/index.html')), {
			status: 404,
		})
	},
})

console.info(`Static SSG preview listening on http://127.0.0.1:${port}`)
