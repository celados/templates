import { beforeEach, describe, expect, it } from 'vitest'
import { fakeBrowser } from 'wxt/testing/fake-browser'

import { handleCounterCommand } from './counter-service'
import { isCounterCommand } from './protocol'

describe('counter service', () => {
	beforeEach(() => {
		fakeBrowser.reset()
	})

	it('persists state outside the service worker lifecycle', async () => {
		expect(await handleCounterCommand({ type: 'counter:get' })).toEqual({
			count: 0,
			type: 'counter:state',
		})
		expect(await handleCounterCommand({ type: 'counter:increment' })).toEqual({
			count: 1,
			type: 'counter:state',
		})
		expect(await handleCounterCommand({ type: 'counter:get' })).toEqual({
			count: 1,
			type: 'counter:state',
		})
	})

	it('resets persisted state', async () => {
		await handleCounterCommand({ type: 'counter:increment' })

		expect(await handleCounterCommand({ type: 'counter:reset' })).toEqual({
			count: 0,
			type: 'counter:state',
		})
	})

	it('serializes concurrent increments', async () => {
		const states = await Promise.all([
			handleCounterCommand({ type: 'counter:increment' }),
			handleCounterCommand({ type: 'counter:increment' }),
		])

		expect(states.map((state) => state.count)).toEqual([1, 2])
		expect(await handleCounterCommand({ type: 'counter:get' })).toEqual({
			count: 2,
			type: 'counter:state',
		})
	})

	it('rejects messages outside the public protocol', () => {
		expect(isCounterCommand({ type: 'counter:increment' })).toBe(true)
		expect(isCounterCommand({ type: 'counter:delete' })).toBe(false)
		expect(isCounterCommand(null)).toBe(false)
	})
})
