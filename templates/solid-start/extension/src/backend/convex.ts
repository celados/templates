import type {
	FunctionArgs,
	FunctionReference,
	FunctionReturnType,
} from 'convex/server'

// `convex` is deliberately not an extension dependency: this import resolves
// to the project root's copy, the same one `web/src/lib/convex.ts` and
// `convex/_generated` type against. A second copy would make ConvexClient's
// private fields two incompatible declarations.
import { ConvexClient } from 'convex/browser'
import { jsonToConvex, convexToJson, type Value } from 'convex/values'
import { createContext, createEffect, untrack, useContext } from 'solid-js'

import { browser } from '#imports'

import { api } from '../../../convex/_generated/api'
import { createQuery } from '../../../web/src/lib/convex'
import { fetchConvexToken, watchSession } from './session'
import { createSnapshots, snapshotKey } from './snapshots'

export type User = NonNullable<FunctionReturnType<typeof api.auth.currentUser>>

export type Backend = ReturnType<typeof createBackend>

/**
 * One live Convex client per extension page. UI roots read the backend
 * directly; the background worker never proxies queries, because a proxy would
 * have to re-implement subscriptions, reconnects, and consistency.
 */
export function createBackend() {
	const url = import.meta.env.VITE_CONVEX_URL as string | undefined
	if (!url) {
		throw new Error(
			'VITE_CONVEX_URL is not set. Run `bun run convex:dev` at the project root.',
		)
	}
	const client = new ConvexClient(url)
	// setAuth pauses the socket until the first token resolves, so no query
	// runs anonymously first. Re-arming on a session cookie change picks up a
	// sign-in or sign-out on the web app while this page stays open; it also
	// ends the previous fetcher's retries, whose answer Convex would discard.
	let tokens: AbortController | undefined
	const arm = () => {
		tokens?.abort()
		const { signal } = (tokens = new AbortController())
		client.setAuth(() => fetchConvexToken(signal))
	}
	arm()
	const unwatch = watchSession(arm)
	// Extension pages share one localStorage origin and read it synchronously,
	// which is what lets the first frame render stored data.
	const snapshots = createSnapshots<User>(
		localStorage,
		browser.runtime.getManifest().version,
	)
	// A raw listener sees only live answers; the Solid source also yields the
	// stored user as its first value, which must not count as confirmation.
	const unconfirm = client.onUpdate(
		api.auth.currentUser,
		{},
		(user) => snapshots.confirm(user),
		// The session source reports the same error through its boundary.
		ignoreError,
	)
	return {
		client,
		snapshots,
		dispose() {
			unconfirm()
			unwatch()
			tokens?.abort()
			void client.close()
		},
	}
}

export const BackendContext = createContext<Backend>(undefined, {
	name: 'BackendContext',
})

export function useBackend(): Backend {
	return useContext(BackendContext)
}

/**
 * The signed-in user: null when signed out, pending only on a first open with
 * nothing stored. Create it above the `<Loading>` that reads it.
 */
export function createSession(backend: Backend) {
	const stored = backend.snapshots.user()
	return createQuery(
		backend.client,
		api.auth.currentUser,
		() => ({}),
		stored === undefined ? undefined : { loadingValue: stored },
	)
}

/**
 * `createQuery` whose first paint is the last live answer stored for these
 * arguments. With nothing stored it behaves like `createQuery`: the enclosing
 * `<Loading>` owns the first paint. The snapshot is looked up once, from the
 * initial arguments; `args` must not read a pending source.
 */
export function createPersistedQuery<Query extends FunctionReference<'query'>>(
	backend: Backend,
	query: Query,
	args: () => FunctionArgs<Query> | null,
) {
	const initial = untrack(args)
	const stored =
		initial === null
			? undefined
			: backend.snapshots.read(snapshotKey(query, initial))
	// Write back live answers only (see createBackend). Convex shares one
	// server subscription between this listener and the query's own.
	createEffect(args, (input) => {
		if (input === null) return
		const key = snapshotKey(query, input)
		return backend.client.onUpdate(
			query,
			input,
			(value: Value) => backend.snapshots.write(key, convexToJson(value)),
			// Without a handler Convex rethrows as an unhandled rejection; the
			// query's own source already routes the error to its boundary.
			ignoreError,
		)
	})
	return createQuery(
		backend.client,
		query,
		args,
		stored === undefined
			? undefined
			: { loadingValue: jsonToConvex(stored) as FunctionReturnType<Query> },
	)
}

function ignoreError() {}
