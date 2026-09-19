import type { ConvexClient } from 'convex/browser'
import type { FunctionReturnType } from 'convex/server'

import { convexClient } from '@convex-dev/better-auth/client/plugins'
import { getRequestEvent } from '@solidjs/web'
import { createAuthClient } from 'better-auth/client'
import { magicLinkClient } from 'better-auth/client/plugins'
import { createContext, createMemo } from 'solid-js'

import { api } from '../../../convex/_generated/api'
import { querySource } from './convex'

export type User = NonNullable<FunctionReturnType<typeof api.auth.currentUser>>

// Same-origin: requests go through routes/api/auth/[...all].ts.
export const authClient = createAuthClient({
	plugins: [convexClient(), magicLinkClient()],
})

/**
 * Give the Convex client a token fetcher. The Convex JWT is short-lived and
 * minted from the Better Auth session cookie, so the fetcher is asked again
 * whenever Convex needs a fresh one.
 */
export function attachAuth(client: ConvexClient) {
	client.setAuth(async () => {
		const { data } = await authClient.convex.token({
			fetchOptions: { throw: false },
		})
		return data?.token ?? null
	})
}

// Better Auth resolves HTTP failures as { error } instead of throwing; actions
// need a rejection so their optimistic state rolls back.
function unwrap<T extends { error: { message?: string } | null }>(result: T) {
	if (result.error) throw new Error(result.error.message ?? 'Request failed')
	return result
}

export async function signInWithGoogle(callbackURL: string) {
	unwrap(await authClient.signIn.social({ provider: 'google', callbackURL }))
}

export async function sendMagicLink(email: string, callbackURL: string) {
	unwrap(await authClient.signIn.magicLink({ email, callbackURL }))
}

/**
 * The server renders the visitor's identity and the browser continues it live,
 * so there is no unknown state to render. null is an authoritative signed-out
 * answer.
 */
export function createAuth(client: ConvexClient) {
	// Without a session the answer is known; asking Convex would hold every
	// anonymous render for a round trip. Async so it serializes.
	const anonymous = getRequestEvent()?.locals.convex?.anonymous
	const user$ = createMemo(() =>
		anonymous
			? Promise.resolve(null)
			: querySource(client, api.auth.currentUser, {}),
	)
	async function signOut() {
		unwrap(await authClient.signOut())
		// The Convex client keeps its last JWT until it expires; re-arming the
		// fetcher makes it ask again now, and the ended session yields no token.
		attachAuth(client)
	}
	return { user$, signOut }
}

export type Auth = ReturnType<typeof createAuth>

export const AuthContext = createContext<Auth>(undefined, {
	name: 'AuthContext',
})
