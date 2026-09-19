import { counterItem } from './counter-store'

/**
 * Persisted count as a Solid 2 async source: the stored value first, then every
 * change from any context. Snapshots replace each other, so a slow reader only
 * needs the newest one. Solid calls return() on owner disposal.
 */
export function counterStream(): AsyncIterable<number> {
	return {
		[Symbol.asyncIterator]() {
			let latest: number | undefined
			let waiting: ((result: IteratorResult<number>) => void) | undefined
			let closed = false
			let seen = false
			const push = (count: number) => {
				if (closed) return
				seen = true
				if (waiting) {
					waiting({ done: false, value: count })
					waiting = undefined
				} else latest = count
			}
			const unwatch = counterItem.watch(push)
			void counterItem.getValue().then((count) => {
				// A watch event that raced ahead of the initial read is newer.
				if (!seen) push(count)
			})
			return {
				next() {
					if (closed) return Promise.resolve({ done: true, value: undefined })
					if (latest !== undefined) {
						const value = latest
						latest = undefined
						return Promise.resolve({ done: false, value })
					}
					return new Promise((resolve) => (waiting = resolve))
				},
				return() {
					closed = true
					unwatch()
					waiting?.({ done: true, value: undefined })
					return Promise.resolve({ done: true, value: undefined })
				},
			}
		},
	}
}
