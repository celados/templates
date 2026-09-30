import type { FetchMiddleware } from '@solidjs/web'

import { getRequestEvent, parseCookieHeader } from '@solidjs/web'
import { ConvexHttpClient } from 'convex/browser'
import { getFunctionName } from 'convex/server'
import { convexToJson } from 'convex/values'

import type { ServerConvex } from './convex'

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
	const ask = async (
		query: Parameters<ServerConvex['query']>[0],
		args: Parameters<ServerConvex['query']>[1],
	) => {
		if (!anonymous) {
			authenticated ??= fetchToken(site, cookie!).then((token) => {
				if (token) http.setAuth(token)
			})
			await authenticated
		}
		return http.query(query, args)
	}
	// One answer per question for the whole render. A <Loading> boundary whose
	// children suspend re-runs them, and a source created in them asks again;
	// a fresh promise each time is a new pending answer on every pass, and the
	// boundary never converges: the Worker burns its CPU on 10001 passes and the
	// document ends after the shell, in a production build only. The same
	// promise comes back settled, so the next pass reads the value.
	const answers = new Map<string, Promise<unknown>>()
	return {
		anonymous,
		query(query, ...rest) {
			const args = rest[0] ?? {}
			const key = `${getFunctionName(query)}:${JSON.stringify(convexToJson(args))}`
			let answer = answers.get(key)
			if (!answer) {
				answer = ask(query, args)
				answers.set(key, answer)
			}
			return answer as never
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
