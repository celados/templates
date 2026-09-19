// @vitest-environment jsdom
import type { ConvexClient } from 'convex/browser'

import { cleanup, render, waitFor } from '@solidjs/testing-library'
import { getFunctionName, type FunctionReference } from 'convex/server'
import { afterEach, describe, expect, it, vi } from 'vite-plus/test'

import type { Backend, User } from '../backend/convex'

import { createSnapshots } from '../backend/snapshots'
import { AccountPanel } from './account-panel'

type Listener = {
	query: string
	value: (value: unknown) => void
	error?: (error: Error) => void
}

// Every listener of a query receives its answer, like one Convex subscription.
function fakeBackend() {
	const listeners = new Set<Listener>()
	const client = {
		onUpdate: (
			query: FunctionReference<'query'>,
			_args: unknown,
			value: Listener['value'],
			error?: Listener['error'],
		) => {
			const listener = { query: getFunctionName(query), value, error }
			listeners.add(listener)
			return Object.assign(() => listeners.delete(listener), {
				getCurrentValue: () => undefined,
			})
		},
	}
	const storage = new Map<string, string>()
	const backend = {
		client: client as unknown as ConvexClient,
		snapshots: createSnapshots<User>(
			{
				getItem: (key) => storage.get(key) ?? null,
				setItem: (key, value) => void storage.set(key, value),
				removeItem: (key) => void storage.delete(key),
			},
			'1.0.0',
		),
		dispose: () => {},
	} satisfies Backend
	const each = (query: string, send: (listener: Listener) => void) => {
		for (const listener of [...listeners]) {
			if (listener.query === query) send(listener)
		}
	}
	return {
		backend,
		answer: (query: string, value: unknown) =>
			each(query, (listener) => listener.value(value)),
		fail: (query: string, error: Error) =>
			each(query, (listener) => listener.error?.(error)),
	}
}

let current: ReturnType<typeof fakeBackend>

// The real client opens a port to the background worker, and the fake
// browser has no i18n messages.
vi.mock('../extension/client', () => ({ reportError: vi.fn() }))
vi.mock('#i18n', () => ({ i18n: { t: (key: string) => key } }))

vi.mock('../backend/convex', async (importOriginal) => ({
	...(await importOriginal<typeof import('../backend/convex')>()),
	createBackend: () => current.backend,
}))

const user: User = { id: 'user-1', email: 'ada@example.com', name: 'Ada' }
const todo = {
	_id: 'todo-1',
	_creationTime: 1,
	ownerId: 'user-1',
	text: 'Write the template',
	completed: false,
}

async function signedInPanel() {
	current = fakeBackend()
	const view = render(() => <AccountPanel />)
	expect(view.getByTestId('account-loading')).toBeDefined()
	await waitFor(() => current.answer('auth:currentUser', user))
	await waitFor(() => view.getByTestId('account-user'))
	current.answer('todos:list', [todo])
	await waitFor(() =>
		expect(view.getByTestId('todos').textContent).toBe(todo.text),
	)
	return view
}

afterEach(cleanup)

describe('account panel', () => {
	it('returns to sign-in when a sign-out fails the todos query in the same transition', async () => {
		const view = await signedInPanel()
		current.fail('todos:list', new Error('Unauthenticated'))
		current.answer('auth:currentUser', null)
		await waitFor(() => view.getByTestId('sign-in'))
		expect(view.queryByTestId('todos-error')).toBeNull()
	})

	it('confines a todos failure to its boundary, which a sign-out then replaces', async () => {
		const view = await signedInPanel()
		current.fail('todos:list', new Error('Server error'))
		await waitFor(() => view.getByTestId('todos-error'))
		expect(view.getByTestId('account-user').textContent).toBe(user.email)

		current.answer('auth:currentUser', null)
		await waitFor(() => view.getByTestId('sign-in'))
	})
})
