import type { ConvexClient } from 'convex/browser'

import { makeFunctionReference } from 'convex/server'
import { createEffect, createRoot, flush, isPending } from 'solid-js'
import { afterEach, describe, expect, it, vi } from 'vite-plus/test'

import type { Backend, User } from './convex'

import { createPersistedQuery } from './convex'
import { createSnapshots, snapshotKey } from './snapshots'

// The real client opens a port to the background worker.
vi.mock('../extension/client', () => ({ reportError: vi.fn() }))

const list = makeFunctionReference<'query', { owner: string }, string[]>(
	'todos:list',
)

// One Convex subscription fans out to every listener of the same query call.
function fakeBackend(storage = new Map<string, string>()) {
	const listeners = new Set<(value: unknown) => void>()
	const client = {
		onUpdate: vi.fn((_query, _args, callback: (value: unknown) => void) => {
			listeners.add(callback)
			return Object.assign(() => listeners.delete(callback), {
				getCurrentValue: () => undefined,
			})
		}),
	}
	const snapshots = createSnapshots<User>(
		{
			getItem: (key) => storage.get(key) ?? null,
			setItem: (key, value) => void storage.set(key, value),
			removeItem: (key) => void storage.delete(key),
		},
		'1.0.0',
	)
	const backend = {
		client: client as unknown as ConvexClient,
		snapshots,
		dispose: () => {},
	} satisfies Backend
	return {
		backend,
		storage,
		emit: (value: unknown) => {
			for (const listener of listeners) listener(value)
		},
	}
}

const user: User = { id: 'alice', email: 'alice@example.com', name: 'Alice' }
const args = { owner: 'alice' }
const disposers: (() => void)[] = []

function mount(backend: Backend) {
	return createRoot((dispose) => {
		disposers.push(dispose)
		const todos$ = createPersistedQuery(backend, list, () => args)
		// Stand-in for the JSX that observes the source in a real root.
		createEffect(todos$, () => {})
		return todos$
	})
}

afterEach(() => {
	for (const dispose of disposers.splice(0)) dispose()
})

describe('persisted Convex queries', () => {
	it('paints the stored answer first, then the live one, and stores it', async () => {
		const storage = new Map<string, string>()
		const seed = fakeBackend(storage)
		seed.backend.snapshots.confirm(user)
		seed.backend.snapshots.write(snapshotKey(list, args), ['stored'])

		const { backend, emit } = fakeBackend(storage)
		const todos$ = mount(backend)
		flush()
		// Born committed: readers never suspend on the first flight.
		expect(todos$()).toEqual(['stored'])
		expect(isPending(todos$)).toBe(false)

		backend.snapshots.confirm(user)
		emit(['live'])
		await vi.waitFor(() => expect(todos$()).toEqual(['live']))

		expect(
			fakeBackend(storage).backend.snapshots.read(snapshotKey(list, args)),
		).toEqual(['live'])
	})

	it('leaves the first paint to Loading when nothing is stored', () => {
		const { backend } = fakeBackend()
		const todos$ = mount(backend)
		flush()
		expect(() => todos$()).toThrow()
	})

	it('does not write the stored answer back as if it were live', () => {
		const storage = new Map<string, string>()
		const seed = fakeBackend(storage)
		seed.backend.snapshots.confirm(user)
		seed.backend.snapshots.write(snapshotKey(list, args), ['stored'])

		const { backend } = fakeBackend(storage)
		const write = vi.spyOn(backend.snapshots, 'write')
		mount(backend)
		flush()
		expect(write).not.toHaveBeenCalled()
	})
})
