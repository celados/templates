import { beforeEach, describe, expect, it } from 'vite-plus/test'
import { fakeBrowser } from 'wxt/testing/fake-browser'

import { counterStream } from './counter-source'
import { counterItem } from './counter-store'

describe('counter source', () => {
	beforeEach(() => {
		fakeBrowser.reset()
	})

	it('yields the stored value, then every change until returned', async () => {
		await counterItem.setValue(3)
		const iterator = counterStream()[Symbol.asyncIterator]()

		expect(await iterator.next()).toEqual({ done: false, value: 3 })
		const next = iterator.next()
		await counterItem.setValue(4)
		expect(await next).toEqual({ done: false, value: 4 })

		await iterator.return?.()
		expect(await iterator.next()).toEqual({ done: true, value: undefined })
	})

	it('keeps only the newest snapshot for a slow reader', async () => {
		const iterator = counterStream()[Symbol.asyncIterator]()
		expect(await iterator.next()).toEqual({ done: false, value: 0 })

		await counterItem.setValue(1)
		await counterItem.setValue(2)
		expect(await iterator.next()).toEqual({ done: false, value: 2 })
		await iterator.return?.()
	})
})
