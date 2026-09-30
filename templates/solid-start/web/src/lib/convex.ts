import type { ConvexClient, ConvexHttpClient } from 'convex/browser'
import type {
	FunctionArgs,
	FunctionReference,
	FunctionReturnType,
	OptionalRestArgs,
} from 'convex/server'

import { liveQuery } from '@solidjs/router'
import { getRequestEvent, isServer } from '@solidjs/web'
import { getFunctionName } from 'convex/server'
import { convexToJson, jsonToConvex } from 'convex/values'
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

/**
 * A Convex query as a Solid async source. The server render reads one snapshot
 * over HTTP with the visitor's identity, as the hand-off; the browser seeds
 * from it and continues with a live subscription after hydration.
 */
function querySource<Query extends FunctionReference<'query'>>(
	client: QueryClient,
	query: Query,
	args: FunctionArgs<Query>,
):
	| Promise<FunctionReturnType<Query>>
	| AsyncIterable<FunctionReturnType<Query>> {
	if (!isServer) {
		return liveChannel(client, query)(JSON.stringify(convexToJson(args)))
	}
	const server = getRequestEvent()?.locals.convex
	// The server's client is disabled and never answers: fail, don't hang.
	if (!server) {
		throw new Error(
			'locals.convex is missing; see serverConvex in middleware.ts',
		)
	}
	// The reader's own promise, not the router's: query() and liveQuery() hand
	// back a new pending answer on every call, which a retried <Loading> never
	// settles on (see ./convex-server).
	return server.query(query, ...([args] as OptionalRestArgs<Query>))
}

type Channel<T> = (args: string) => AsyncIterable<T>

const channels = new WeakMap<
	QueryClient,
	{ id: number; byFunction: Map<string, Channel<unknown>> }
>()
let clients = 0

/**
 * The router's live layer over one Convex function: a channel per arguments,
 * shared by every reader, branded so a hydrated server snapshot goes live, and
 * warmed by a link preload. The router keys channels process-wide by name, so
 * the name carries the client; arguments travel as Convex JSON, which encodes
 * what JSON.stringify cannot (int64, bytes).
 */
function liveChannel<Query extends FunctionReference<'query'>>(
	client: QueryClient,
	query: Query,
): Channel<FunctionReturnType<Query>> {
	let own = channels.get(client)
	if (!own)
		channels.set(client, (own = { id: ++clients, byFunction: new Map() }))
	const name = getFunctionName(query)
	let channel = own.byFunction.get(name)
	if (!channel) {
		channel = liveQuery(
			(args: string) =>
				subscription(
					client,
					query,
					jsonToConvex(JSON.parse(args)) as FunctionArgs<Query>,
				),
			`convex:${own.id}:${name}`,
		)
		own.byFunction.set(name, channel)
	}
	return channel as Channel<FunctionReturnType<Query>>
}

// A channel reconnects a stream that fails after a value, unless the failure
// carries a 4xx status. A Convex query error is the function's answer (the
// client recovers its own transport), so it ends the channel and reaches
// <Errored>.
const terminal = (error: Error) =>
	'status' in error ? error : Object.assign(error, { status: 400 })

// Snapshots replace each other: a slow reader needs only the newest value.
// The channel owns iterator.return(), once its last reader has left.
function subscription<Query extends FunctionReference<'query'>>(
	client: QueryClient,
	query: Query,
	args: FunctionArgs<Query>,
): AsyncIterable<FunctionReturnType<Query>> {
	type Value = FunctionReturnType<Query>
	return {
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
						failure = terminal(error)
						waiting?.reject(failure)
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
					// The first pull subscribes.
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

export type QueryOptions<Query extends FunctionReference<'query'>> = {
	/**
	 * Declared first paint, only for UI that deliberately renders provisional
	 * data.
	 */
	loadingValue?: FunctionReturnType<Query> | undefined
	/**
	 * 'client': the server renders the fallback or loadingValue and the browser
	 * asks.
	 */
	ssrSource?: 'server' | 'client'
}

/**
 * Solid owns readiness and disposal; Convex owns the live snapshots. By default
 * the server renders the first answer and the browser continues it live; an app
 * that must not server-render a read passes `ssrSource: 'client'`.
 *
 * Keep the source in a stable owner above the Loading branch that reads it. A
 * child reading a prop during setup may retry that branch, so recreating the
 * source inside the same branch can produce an endless first-load loop.
 *
 * Without loadingValue, Loading/Errored own first-load UI: a read under
 * <Loading> streams in behind the shell, a read outside one holds the document.
 * With loadingValue, the first flight is quiet (isPending is false): the
 * provisional value itself must distinguish unknown from a real empty/missing
 * answer. Later changes use normal transitions. Do not use this option to hide
 * missing boundaries.
 *
 * Public async reads and their async-derived reads use a $ suffix. It documents
 * a read contract, not a Promise type; commands keep verb names.
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
