import { beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { fakeBrowser } from 'wxt/testing/fake-browser'

import { storage } from '#imports'

import { live } from './live'

const item = storage.defineItem<number>('local:live-test', { fallback: 0 })

describe('live', () => {
	beforeEach(() => {
		fakeBrowser.reset()
	})

	it('yields the stored value, then every change until returned', async () => {
		await item.setValue(3)
		const iterator = live(item)[Symbol.asyncIterator]()

		expect(await iterator.next()).toEqual({ done: false, value: 3 })
		const next = iterator.next()
		await item.setValue(4)
		expect(await next).toEqual({ done: false, value: 4 })

		await iterator.return?.()
		expect(await iterator.next()).toEqual({ done: true, value: undefined })
	})

	it('keeps only the newest snapshot for a slow reader', async () => {
		const iterator = live(item)[Symbol.asyncIterator]()
		expect(await iterator.next()).toEqual({ done: false, value: 0 })

		await item.setValue(1)
		await item.setValue(2)
		expect(await iterator.next()).toEqual({ done: false, value: 2 })
		await iterator.return?.()
	})

	// The case an async generator gets wrong: disposal while waiting.
	it('settles a pending read and unwatches when returned', async () => {
		const unwatch = vi.fn()
		const iterator = live({
			getValue: () => Promise.resolve(1),
			watch: () => unwatch,
		})[Symbol.asyncIterator]()
		await iterator.next()
		const pending = iterator.next()

		await iterator.return?.()
		expect(await pending).toEqual({ done: true, value: undefined })
		expect(unwatch).toHaveBeenCalledOnce()
	})

	it('rejects the reader when the first read fails', async () => {
		const iterator = live({
			getValue: () => Promise.reject(new Error('storage unavailable')),
			watch: () => () => {},
		})[Symbol.asyncIterator]()
		await expect(iterator.next()).rejects.toThrow('storage unavailable')
	})
})
