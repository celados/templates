const SITE = import.meta.env.VITE_CONVEX_SITE_URL

/**
 * Forward public HTTP surfaces to the Convex site without exposing its
 * hostname.
 */
export function proxyConvexSite(request: Request): Promise<Response> {
	if (!SITE) {
		return Promise.resolve(
			new Response('VITE_CONVEX_SITE_URL is not set', { status: 500 }),
		)
	}
	const incoming = new URL(request.url)
	const target = new URL(`${incoming.pathname}${incoming.search}`, SITE)
	const headers = new Headers(request.headers)
	// Hop-by-hop headers describe this connection, not the upstream request.
	headers.delete('transfer-encoding')
	headers.delete('content-length')
	headers.delete('connection')
	// fetch owns decompression; forwarding the browser's encoding promise could
	// leave the downstream response headers describing bytes it already decoded.
	headers.delete('accept-encoding')
	headers.set('host', target.host)
	headers.set('x-forwarded-host', incoming.host)
	headers.set('x-forwarded-proto', incoming.protocol.replace(/:$/u, ''))
	headers.set('x-better-auth-forwarded-host', incoming.host)
	headers.set(
		'x-better-auth-forwarded-proto',
		incoming.protocol.replace(/:$/u, ''),
	)
	return fetch(target, {
		method: request.method,
		headers,
		body: request.body,
		redirect: 'manual',
		// @ts-expect-error duplex is required for streaming request bodies
		duplex: 'half',
	})
}
