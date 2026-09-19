import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'

import { reportError } from '../extension/client'
import { fetchConvexToken } from './session'

vi.mock('../extension/client', () => ({ reportError: vi.fn() }))

const fetchMock = vi.fn<typeof fetch>()

beforeEach(() => {
	vi.useFakeTimers()
	vi.stubGlobal('fetch', fetchMock)
	vi.stubGlobal('navigator', { onLine: true })
})

afterEach(() => {
	vi.useRealTimers()
	vi.unstubAllGlobals()
})

const token = () => Response.json({ token: 'jwt' })

describe('Convex token from the web app session', () => {
	it('resolves the token, or null only for a 401', async () => {
		fetchMock.mockResolvedValueOnce(token())
		expect(await fetchConvexToken(new AbortController().signal)).toBe('jwt')

		fetchMock.mockResolvedValueOnce(new Response(null, { status: 401 }))
		expect(await fetchConvexToken(new AbortController().signal)).toBeNull()
	})

	it('retries other failures and reports them once', async () => {
		fetchMock
			.mockResolvedValueOnce(new Response(null, { status: 403 }))
			.mockResolvedValueOnce(new Response(null, { status: 403 }))
			.mockResolvedValueOnce(token())
		const result = fetchConvexToken(new AbortController().signal)
		await vi.runAllTimersAsync()

		expect(await result).toBe('jwt')
		expect(fetchMock).toHaveBeenCalledTimes(3)
		expect(reportError).toHaveBeenCalledTimes(1)
	})

	it('does not report while offline', async () => {
		vi.stubGlobal('navigator', { onLine: false })
		fetchMock
			.mockRejectedValueOnce(new TypeError('Failed to fetch'))
			.mockResolvedValueOnce(token())
		const result = fetchConvexToken(new AbortController().signal)
		await vi.runAllTimersAsync()

		expect(await result).toBe('jwt')
		expect(reportError).not.toHaveBeenCalled()
	})

	it('stops retrying when aborted', async () => {
		fetchMock.mockResolvedValue(new Response(null, { status: 503 }))
		const controller = new AbortController()
		const result = fetchConvexToken(controller.signal)
		await vi.advanceTimersByTimeAsync(0)
		controller.abort()

		expect(await result).toBeNull()
		await vi.runAllTimersAsync()
		expect(fetchMock).toHaveBeenCalledTimes(1)
	})
})
