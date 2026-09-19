/**
 * A value that can be read now and watched for changes. WXT storage items
 * satisfy it structurally, as would any store with the same two methods, so
 * `live` does not depend on WXT.
 */
export type Watchable<T> = {
	getValue(): Promise<T>
	/** Returns the unwatch. */
	watch(callback: (value: T) => void): () => void
}

/**
 * A watchable value as a Solid 2 async source: the current value first, then
 * every change. For an extension storage item, changes arrive from any context
 * (another page, a content script, the worker). `createMemo(() => live(item))`
 * reads it like any async value, and a `<Loading>` above covers the first read.
 * Snapshots replace each other, so a slow reader only needs the newest one.
 * Solid calls return() on owner disposal. The Convex counterpart is
 * `liveStream` in `web/src/lib/convex.ts`.
 *
 * Hand-written rather than an async generator: a generator's return() queues
 * behind a pending next(), so disposing a reader that is waiting for a change
 * would never reach `finally` and the watch would leak.
 *
 * No `solid.LiveSource` brand: Solid reads it only to hand a server-rendered
 * snapshot over to a live source during hydration, and extension pages render
 * client-only.
 */
export function live<T>(item: Watchable<T>): AsyncIterable<T> {
	return {
		[Symbol.asyncIterator]() {
			// Boxed: stored values may legitimately be null or undefined.
			let latest: { value: T } | undefined
			let failure: unknown
			let waiting:
				| {
						resolve: (result: IteratorResult<T>) => void
						reject: (error: unknown) => void
				  }
				| undefined
			let closed = false
			let seen = false
			const push = (value: T) => {
				if (closed) return
				seen = true
				if (waiting) {
					waiting.resolve({ done: false, value })
					waiting = undefined
				} else latest = { value }
			}
			// Watch before the first read, so no change falls between them.
			const unwatch = item.watch(push)
			item.getValue().then(
				(value) => {
					// A watch event that raced ahead of the initial read is newer.
					if (!seen) push(value)
				},
				(error: unknown) => {
					if (closed) return
					failure = error
					waiting?.reject(error)
					waiting = undefined
				},
			)
			return {
				next() {
					if (failure !== undefined) return Promise.reject(failure)
					if (closed) return Promise.resolve({ done: true, value: undefined })
					if (latest) {
						const { value } = latest
						latest = undefined
						return Promise.resolve({ done: false, value })
					}
					return new Promise((resolve, reject) => {
						waiting = { resolve, reject }
					})
				},
				return() {
					closed = true
					unwatch()
					waiting?.resolve({ done: true, value: undefined })
					waiting = undefined
					return Promise.resolve({ done: true, value: undefined })
				},
			}
		},
	}
}
