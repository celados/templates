import { isServer } from '@solidjs/web'
import { ConvexClient } from 'convex/browser'

// One live client per browser session. Solid components reach it through the
// ConvexProvider in ./convex; auth is attached in ./auth.
//
// On the server there is no singleton: workerd cancels promises that cross
// request contexts, so a client created during one request must not be
// touched by the next. A disabled client costs nothing and nothing
// subscribes during SSR anyway.
let client: ConvexClient | undefined

export function getConvexClient(): ConvexClient {
	const url = import.meta.env.VITE_CONVEX_URL
	if (!url) {
		throw new Error('VITE_CONVEX_URL is required to call the Convex backend.')
	}
	if (isServer) {
		return new ConvexClient(url, { disabled: true })
	}
	client ??= new ConvexClient(url)
	return client
}
