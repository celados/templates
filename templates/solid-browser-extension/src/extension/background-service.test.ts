import {
	createProxyService,
	type ProxyService,
} from '@webext-core/proxy-service'
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { fakeBrowser } from 'wxt/testing/fake-browser'

import {
	type BackgroundService,
	registerBackgroundService,
} from './background-service'
import { counterItem } from './counter-store'
import { BACKGROUND_SERVICE_KEY } from './services'

describe('background service', () => {
	const errors = vi.fn()
	let background: ProxyService<BackgroundService>

	beforeEach(() => {
		fakeBrowser.reset()
		registerBackgroundService(errors)
		background = createProxyService(BACKGROUND_SERVICE_KEY)
	})

	it('persists counter mutations outside the worker lifetime', async () => {
		expect(await background.counter.increment()).toBe(1)
		expect(await counterItem.getValue()).toBe(1)
		expect(await background.counter.reset()).toBe(0)
		expect(await counterItem.getValue()).toBe(0)
	})

	it('serializes concurrent increments', async () => {
		const counts = await Promise.all([
			background.counter.increment(),
			background.counter.increment(),
		])

		expect(counts).toEqual([1, 2])
		expect(await counterItem.getValue()).toBe(2)
	})

	it('exposes only declared methods to untrusted senders', async () => {
		// Without a null prototype this path resolves to Object.assign.
		const escape = background.counter as unknown as {
			constructor: { assign: (...args: object[]) => Promise<unknown> }
		}

		await expect(
			escape.constructor.assign({}, { leaked: true }),
		).resolves.not.toEqual({
			leaked: true,
		})
	})

	it('validates error reports before capturing them', async () => {
		await background.diagnostics.report({
			context: 'content-script',
			message: 'boom',
			name: 'TypeError',
		})
		await background.diagnostics.report({ message: 42 } as never)

		expect(errors).toHaveBeenCalledOnce()
		const [error, context] = errors.mock.calls[0] ?? []
		expect(context).toBe('content-script')
		expect(error).toMatchObject({ message: 'boom', name: 'TypeError' })
	})
})
