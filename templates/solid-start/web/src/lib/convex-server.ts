import type { FetchMiddleware } from '@solidjs/web'

import { getRequestEvent, parseCookieHeader } from '@solidjs/web'
import { ConvexHttpClient } from 'convex/browser'

/** One-shot, identity-carrying reads for the server render. */
export type ServerConvex = Pick<ConvexHttpClient, 'query'> & {
	/** No session cookie: every identity-dependent answer is the signed-out one. */
	readonly anonymous: boolean
}

declare module '@solidjs/web' {
	interface RequestEventLocals {
		/** Present during the server render only; see ./auth `createAuth`. */
		convex?: ServerConvex
	}
}

// Better Auth's default session cookie (`__Secure-` prefixed over HTTPS).
const SESSION_COOKIES = [
	'better-auth.session_token',
	'__Secure-better-auth.session_token',
]

/**
 * Hang a per-request Convex reader on `locals`. Nothing is fetched until the
 * render asks, so API routes and the auth proxy never pay for a token.
 */
export const serverConvex: FetchMiddleware = (request, next) => {
	getRequestEvent()!.locals.convex = createServerConvex(request)
	return next()
}

function createServerConvex(request: Request): ServerConvex {
	const url = import.meta.env.VITE_CONVEX_URL
	const site = import.meta.env.VITE_CONVEX_SITE_URL
	if (!url || !site) {
		throw new Error(
			'VITE_CONVEX_URL and VITE_CONVEX_SITE_URL are required to render Convex reads.',
		)
	}
	const cookie = request.headers.get('cookie')
	const cookies = parseCookieHeader(cookie)
	const anonymous = !SESSION_COOKIES.some((name) => name in cookies)
	// Per request, never module-level: workerd cancels promises that cross
	// request contexts, and the token belongs to this visitor only.
	const http = new ConvexHttpClient(url)
	let authenticated: Promise<void> | undefined
	return {
		anonymous,
		async query(query, ...args) {
			if (!anonymous) {
				authenticated ??= fetchToken(site, cookie!).then((token) => {
					if (token) http.setAuth(token)
				})
				await authenticated
			}
			return http.query(query, ...args)
		},
	}
}

/**
 * The same JWT the browser mints through `authClient.convex.token()`, asked of
 * the Convex site directly. Anything but a token renders anonymously, which is
 * also what the browser's fetcher does; the live query corrects it once the
 * socket authenticates.
 */
async function fetchToken(
	site: string,
	cookie: string,
): Promise<string | null> {
	const response = await fetch(new URL('/api/auth/convex/token', site), {
		headers: { cookie },
	})
	if (response.ok) return ((await response.json()) as { token: string }).token
	// 401 is a signed-out or expired session; anything else is worth a log line.
	if (response.status !== 401) {
		console.error(`Convex token request answered ${response.status}`)
	}
	return null
}
