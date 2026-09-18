import type { ConvexClient } from 'convex/browser'
import type { FunctionReturnType } from 'convex/server'

import { convexClient } from '@convex-dev/better-auth/client/plugins'
import { createAuthClient } from 'better-auth/client'
import { magicLinkClient } from 'better-auth/client/plugins'
import { createContext } from 'solid-js'

import { api } from '../../../convex/_generated/api'
import { createQuery } from './convex'

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

/** Auth is provisional so restoring a session never blocks public rendering. */
export function createAuth(client: ConvexClient) {
	// Undefined is unknown; null is an authoritative signed-out answer. Never
	// collapse them: only the latter may redirect to sign-in. loadingValue makes
	// the first flight quiet, so read the value's meaning instead of isPending.
	const user$ = createQuery(client, api.auth.currentUser, () => ({}), {
		loadingValue: undefined,
	})
	async function signOut() {
		unwrap(await authClient.signOut())
		// Re-arming the fetcher drops the cached JWT, so live queries re-run as
		// anonymous instead of waiting for the old token to expire.
		attachAuth(client)
	}
	return { user$, signOut }
}

export type Auth = ReturnType<typeof createAuth>

export const AuthContext = createContext<Auth>(undefined, {
	name: 'AuthContext',
})
