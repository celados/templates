import { createRouterClient } from '@orpc/server'
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { fakeBrowser } from 'wxt/testing/fake-browser'

import { counterItem } from './counter-store'
import { createRouter } from './router'

describe('background router', () => {
	const errors = vi.fn()
	let background: ReturnType<typeof client>

	function client() {
		return createRouterClient(createRouter(errors), {
			context: { sender: undefined },
		})
	}

	beforeEach(() => {
		fakeBrowser.reset()
		background = client()
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

	it('validates error reports before capturing them', async () => {
		await background.diagnostics.report({
			context: 'content-script',
			message: 'boom',
			name: 'TypeError',
		})
		await expect(
			background.diagnostics.report({ message: 42 } as never),
		).rejects.toMatchObject({ code: 'BAD_REQUEST' })

		expect(errors).toHaveBeenCalledOnce()
		const [error, context] = errors.mock.calls[0] ?? []
		expect(context).toBe('content-script')
		expect(error).toMatchObject({ message: 'boom', name: 'TypeError' })
	})
})
