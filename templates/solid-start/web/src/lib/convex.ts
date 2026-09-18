import type { ConvexClient } from 'convex/browser'
import type {
	FunctionArgs,
	FunctionReference,
	FunctionReturnType,
} from 'convex/server'

import { createContext, createMemo, useContext } from 'solid-js'

// The creator owns the client lifetime; providers only scope borrowed instances.
// Solid 2 contexts are providers and throw on missing values without a fallback.
export const ConvexProvider = createContext<ConvexClient>(undefined, {
	name: 'ConvexProvider',
})

export function useConvexClient(): ConvexClient {
	return useContext(ConvexProvider)
}

type QueryClient = Pick<ConvexClient, 'onUpdate'>

// Snapshots replace each other: a slow reader needs only the newest value.
// Solid owns iterator.return() on parameter changes and owner disposal.
function queryStream<Query extends FunctionReference<'query'>>(
	client: QueryClient,
	query: Query,
	args: FunctionArgs<Query>,
): AsyncIterable<FunctionReturnType<Query>> {
	type Value = FunctionReturnType<Query>
	return {
		[Symbol.asyncIterator]() {
			let closed = false
			let buffered: IteratorResult<Value> | undefined
			let failure: Error | undefined
			let waiting:
				| ReturnType<typeof Promise.withResolvers<IteratorResult<Value>>>
				| undefined
			const subscription = client.onUpdate(
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
			function close() {
				if (!closed) {
					closed = true
					subscription()
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
					waiting = Promise.withResolvers<IteratorResult<Value>>()
					return waiting.promise
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
 * Keep the source in a stable owner above the Loading branch that reads it. A
 * child reading a prop during setup may retry that branch, so recreating the
 * source inside the same branch can produce an endless first-load loop.
 *
 * Without options, Loading/Errored own first-load UI. With loadingValue, the
 * first flight is quiet (isPending is false): the provisional value itself must
 * distinguish unknown from a real empty/missing answer. Later changes use
 * normal transitions. Do not use this option to hide missing boundaries.
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
	const compute = () => {
		const input = args()
		return input === null ? undefined : queryStream(client, query, input)
	}
	// Live subscriptions have no server value. Solid renders the enclosing
	// Loading fallback and starts this source after hydration (Solid RFC 05).
	if (options) {
		const declared = createMemo<FunctionReturnType<Query> | undefined>(
			compute,
			{ ssrSource: 'client', loadingValue: options.loadingValue },
		)
		return declared
	}
	const suspended = createMemo<FunctionReturnType<Query> | undefined>(compute, {
		ssrSource: 'client',
	})
	return suspended
}

/** CreateQuery on the provided client, for components outside the studio store. */
export function createConvexQuery<Query extends FunctionReference<'query'>>(
	query: Query,
	args: () => FunctionArgs<Query> | null,
	options?: QueryOptions<Query>,
) {
	return createQuery(useConvexClient(), query, args, options)
}

export { queryStream }
