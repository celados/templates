import { isServer } from '@solidjs/web'
import { ConvexClient } from 'convex/browser'

import { attachAuth } from './auth'

// One live client per browser session. Solid components reach it through the
// ConvexProvider in ./convex.
//
// On the server there is no singleton: workerd cancels promises that cross
// request contexts, so a client created during one request must not be
// touched by the next. A disabled client costs nothing and nothing
// subscribes during SSR anyway; server reads go through ./convex-server.
let client: ConvexClient | undefined

export function getConvexClient(): ConvexClient {
	const url = import.meta.env.VITE_CONVEX_URL
	if (!url) {
		throw new Error('VITE_CONVEX_URL is required to call the Convex backend.')
	}
	if (isServer) {
		return new ConvexClient(url, { disabled: true })
	}
	if (!client) {
		client = new ConvexClient(url)
		// Before any subscription exists: setAuth pauses the socket until the
		// first token resolves, so no query answers anonymously first and
		// overwrites the identity the server rendered.
		attachAuth(client)
	}
	return client
}
