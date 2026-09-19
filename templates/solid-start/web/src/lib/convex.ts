import type { ConvexClient, ConvexHttpClient } from 'convex/browser'
import type {
	FunctionArgs,
	FunctionReference,
	FunctionReturnType,
	OptionalRestArgs,
} from 'convex/server'

import { getRequestEvent, isServer } from '@solidjs/web'
import { createContext, createMemo, useContext } from 'solid-js'

// The creator owns the client lifetime; providers only scope borrowed instances.
// Solid 2 contexts are providers and throw on missing values without a fallback.
export const ConvexProvider = createContext<ConvexClient>(undefined, {
	name: 'ConvexProvider',
})

export function useConvexClient(): ConvexClient {
	return useContext(ConvexProvider)
}

/** One-shot, identity-carrying reads for the server render; see ./convex-server. */
export type ServerConvex = Pick<ConvexHttpClient, 'query'> & {
	/** No session cookie: every identity-dependent answer is the signed-out one. */
	readonly anonymous: boolean
}

declare module '@solidjs/web' {
	interface RequestEventLocals {
		convex?: ServerConvex
	}
}

type QueryClient = Pick<ConvexClient, 'onUpdate'>

// Solid's registered brand for a value-shaped live source: every subscription
// re-yields the current answer and the newest wins. Hydrating a server-rendered
// read, Solid adopts the serialized snapshot and re-runs the compute after
// hydration only when its browser value carries this brand, whichever
// primitive holds it; without the brand the snapshot would never go live.
// https://github.com/solidjs/solid/blob/next/packages/solid/test/client-hydration.spec.ts
const LIVE_SOURCE: unique symbol = Symbol.for('solid.LiveSource')

type LiveSource<T> = AsyncIterable<T> & { readonly [LIVE_SOURCE]: true }

/**
 * A Convex query as a Solid async source. The server render reads one snapshot
 * over HTTP with the visitor's identity, as the hand-off; the browser seeds
 * from it and continues with a live subscription after hydration.
 */
function querySource<Query extends FunctionReference<'query'>>(
	client: QueryClient,
	query: Query,
	args: FunctionArgs<Query>,
): Promise<FunctionReturnType<Query>> | LiveSource<FunctionReturnType<Query>> {
	if (!isServer) return liveStream(client, query, args)
	const server = getRequestEvent()?.locals.convex
	// The server's client is disabled and never answers: fail, don't hang.
	if (!server) {
		throw new Error(
			'locals.convex is missing; see serverConvex in middleware.ts',
		)
	}
	return server.query(query, ...([args] as OptionalRestArgs<Query>))
}

// Snapshots replace each other: a slow reader needs only the newest value.
// Solid owns iterator.return() on parameter changes and owner disposal.
function liveStream<Query extends FunctionReference<'query'>>(
	client: QueryClient,
	query: Query,
	args: FunctionArgs<Query>,
): LiveSource<FunctionReturnType<Query>> {
	type Value = FunctionReturnType<Query>
	return {
		[LIVE_SOURCE]: true,
		[Symbol.asyncIterator]() {
			let subscription: (() => void) | undefined
			let closed = false
			let buffered: IteratorResult<Value> | undefined
			let failure: Error | undefined
			let waiting:
				| {
						resolve: (result: IteratorResult<Value>) => void
						reject: (error: Error) => void
				  }
				| undefined
			function subscribe() {
				subscription = client.onUpdate(
					query,
					args,
					(value) => {
						if (closed) return
						const result: IteratorResult<Value> = { done: false, value }
						if (waiting) {
							waiting.resolve(result)
							waiting = undefined
						} else buffered = result
					},
					(error) => {
						if (closed) return
						failure = error
						waiting?.reject(error)
						waiting = undefined
						close()
					},
				)
			}
			function close() {
				if (!closed) {
					closed = true
					subscription?.()
					buffered = undefined
					waiting?.resolve({ done: true, value: undefined })
					waiting = undefined
				}
			}
			return {
				next() {
					if (failure) return Promise.reject(failure)
					if (closed)
						return Promise.resolve({ done: true as const, value: undefined })
					if (buffered) {
						const result = buffered
						buffered = undefined
						return Promise.resolve(result)
					}
					// The first pull subscribes, inside the executor: hydrating a
					// server-rendered read, Solid traces the compute and pulls once
					// with a mock Promise that never runs executors, so the trace
					// opens no subscription that nothing would ever close.
					return new Promise<IteratorResult<Value>>((resolve, reject) => {
						waiting = { resolve, reject }
						if (!subscription) subscribe()
					})
				},
				return() {
					close()
					return Promise.resolve({ done: true as const, value: undefined })
				},
			}
		},
	}
}

/** Declared first paint, only for UI that deliberately renders provisional data. */
export type QueryOptions<Query extends FunctionReference<'query'>> = {
	loadingValue: FunctionReturnType<Query> | undefined
}

/**
 * Solid owns readiness and iterator disposal; Convex owns the live snapshots.
 * The server renders the first answer and the browser continues it live. Keep
 * the source in a stable owner above the Loading branch that reads it. A child
 * reading a prop during setup may retry that branch, so recreating the source
 * inside the same branch can produce an endless first-load loop.
 *
 * Without options, Loading/Errored own first-load UI: a read under <Loading>
 * streams in behind the shell, a read outside one holds the document. With
 * loadingValue, the first flight is quiet (isPending is false): the provisional
 * value itself must distinguish unknown from a real empty/missing answer. Later
 * changes use normal transitions. Do not use this option to hide missing
 * boundaries.
 *
 * Public async reads and their async-derived reads use a $ suffix in this app.
 * It documents a read contract, not a Promise type; commands keep verb names.
 *
 * @see https://github.com/solidjs/solid/blob/next/documentation/solid-2.0/05-async-data.md
 */
export function createQuery<Query extends FunctionReference<'query'>>(
	client: QueryClient,
	query: Query,
	args: () => FunctionArgs<Query> | null,
	options?: QueryOptions<Query>,
) {
	return createMemo<FunctionReturnType<Query> | undefined>(() => {
		const input = args()
		return input === null ? undefined : querySource(client, query, input)
	}, options)
}

/** CreateQuery on the provided client, for components outside the studio store. */
export function createConvexQuery<Query extends FunctionReference<'query'>>(
	query: Query,
	args: () => FunctionArgs<Query> | null,
	options?: QueryOptions<Query>,
) {
	return createQuery(useConvexClient(), query, args, options)
}

export { querySource }
