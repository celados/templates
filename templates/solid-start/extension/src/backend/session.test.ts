import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'

import { browser, type Browser } from '#imports'

import { reportError } from '../extension/client'
import { fetchConvexToken, watchSession } from './session'

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

describe('web app session cookie', () => {
	type Change = Browser.cookies.CookieChangeInfo
	function watch() {
		let listener!: (change: Change) => void
		vi.spyOn(browser.cookies.onChanged, 'addListener').mockImplementation(
			(callback) => void (listener = callback),
		)
		const onChange = vi.fn<(signedOut: boolean) => void>()
		watchSession(onChange)
		const fire = (
			name: string,
			removed: boolean,
			cause: Change['cause'],
			domain = 'localhost',
		) =>
			listener({ cookie: { name, domain } as Change['cookie'], removed, cause })
		return { onChange, fire }
	}

	it('signals a sign-out only for a removal, not for a refresh', () => {
		const { onChange, fire } = watch()
		// Better Auth refreshing the session overwrites the cookie: Chrome fires
		// the removal of the old value, then the new one.
		fire('better-auth.session_token', true, 'overwrite')
		fire('better-auth.session_token', false, 'explicit')
		expect(onChange.mock.calls).toEqual([[false]])

		fire('__Secure-better-auth.session_token', true, 'expired_overwrite')
		expect(onChange).toHaveBeenLastCalledWith(true)
	})

	it('ignores the JWT cookie a token request sets, and other hosts', () => {
		const { onChange, fire } = watch()
		fire('better-auth.convex_jwt', false, 'explicit')
		fire('better-auth.session_token', false, 'explicit', 'example.com')
		expect(onChange).not.toHaveBeenCalled()
	})
})
