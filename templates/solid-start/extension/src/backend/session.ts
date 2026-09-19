import { browser, type Browser } from '#imports'

// wxt.config.ts defaults this to the web app's dev origin.
const SITE_URL = new URL(import.meta.env.WXT_SITE_URL as string)

// Endpoint of the Better Auth Convex plugin that web/src/lib/auth.ts calls as
// `authClient.convex.token()`. Better Auth checks Origin only on non-GET
// requests, so the site needs no extension origin in `trustedOrigins`.
const TOKEN_URL = new URL('/api/auth/convex/token', SITE_URL)

// Better Auth's default session cookie (`__Secure-` prefixed over HTTPS).
const SESSION_COOKIE = 'better-auth.session_token'

/**
 * Mint a Convex JWT from the web app's session cookie. The extension holds no
 * credentials: people sign in and out on the site, and the host permission lets
 * this request carry the site's cookies.
 *
 * Only a 401 means signed out. An unreachable site is an unknown identity, so
 * the fetch waits for it instead of resolving null: Convex keeps its socket
 * paused meanwhile, and the stored snapshot is not cleared as if the person had
 * signed out.
 */
export async function fetchConvexToken(): Promise<string | null> {
	for (let delay = 1000; ; delay = Math.min(delay * 2, 30_000)) {
		try {
			const response = await fetch(TOKEN_URL, { credentials: 'include' })
			if (response.ok) {
				return ((await response.json()) as { token: string }).token
			}
			if (response.status === 401) return null
		} catch {
			// Offline or the site is down; retry below.
		}
		await new Promise((resolve) => setTimeout(resolve, delay))
	}
}

/**
 * Call `onChange` when the site's session cookie is set or removed, i.e. when
 * the person signs in or out on the web app while this UI stays open.
 */
export function watchSession(onChange: () => void): () => void {
	const listener = ({
		cookie,
		removed,
		cause,
	}: Browser.cookies.CookieChangeInfo) => {
		// An overwrite fires a removal and then the new value; react once.
		if (removed && cause === 'overwrite') return
		// Minting a token also writes a JWT cookie on the same host; matching the
		// session cookie by name keeps that from re-triggering a token fetch.
		if (!cookie.name.endsWith(SESSION_COOKIE)) return
		if (cookie.domain.replace(/^\./u, '') !== SITE_URL.hostname) return
		onChange()
	}
	browser.cookies.onChanged.addListener(listener)
	return () => browser.cookies.onChanged.removeListener(listener)
}

export function openSignIn(): void {
	void browser.tabs.create({ url: new URL('/sign-in', SITE_URL).href })
}
