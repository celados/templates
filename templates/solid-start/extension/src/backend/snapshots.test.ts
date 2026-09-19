import { describe, expect, it } from 'vite-plus/test'

import { createSnapshots } from './snapshots'

type User = { id: string; email: string }

const alice: User = { id: 'alice', email: 'alice@example.com' }
const bob: User = { id: 'bob', email: 'bob@example.com' }

function memoryStorage() {
	const items = new Map<string, string>()
	return {
		items,
		getItem: (key: string) => items.get(key) ?? null,
		setItem: (key: string, value: string) => void items.set(key, value),
		removeItem: (key: string) => void items.delete(key),
	}
}

function reopen(storage: ReturnType<typeof memoryStorage>, version = '1.0.0') {
	return createSnapshots<User>(storage, version)
}

describe('query snapshots', () => {
	it('holds live answers until the user is confirmed, then persists them', () => {
		const storage = memoryStorage()
		const first = reopen(storage)
		first.write('todos:list:{}', ['held'])
		expect(storage.items.size).toBe(0)
		first.confirm(alice)
		first.write('todos:list:{}', ['live'])

		const next = reopen(storage)
		expect(next.user()).toEqual(alice)
		expect(next.read('todos:list:{}')).toEqual(['live'])
	})

	it('flushes held answers when the stored user is confirmed again', () => {
		const storage = memoryStorage()
		const first = reopen(storage)
		first.confirm(alice)

		const second = reopen(storage)
		second.write('todos:list:{}', ['fresh'])
		second.confirm(alice)

		expect(reopen(storage).read('todos:list:{}')).toEqual(['fresh'])
	})

	it("never gives one user's snapshots to another", () => {
		const storage = memoryStorage()
		const first = reopen(storage)
		first.confirm(alice)
		first.write('todos:list:{}', ['alice'])

		// Bob signed in on the web app while the extension was closed; an
		// answer held before confirmation may still be Alice's.
		const second = reopen(storage)
		second.write('todos:list:{}', ['unconfirmed'])
		second.confirm(bob)

		const next = reopen(storage)
		expect(next.user()).toEqual(bob)
		expect(next.read('todos:list:{}')).toBeUndefined()
	})

	it('clears everything when the person is signed out', () => {
		const storage = memoryStorage()
		const first = reopen(storage)
		first.confirm(alice)
		first.write('todos:list:{}', ['alice'])
		first.confirm(null)
		first.write('todos:list:{}', ['anonymous'])

		expect(storage.items.size).toBe(0)
		expect(reopen(storage).user()).toBeUndefined()
	})

	it('drops snapshots from another extension version or in a broken shape', () => {
		const storage = memoryStorage()
		const first = reopen(storage, '1.0.0')
		first.confirm(alice)
		expect(reopen(storage, '1.1.0').user()).toBeUndefined()

		storage.items.set('convex-snapshots', '{not json')
		expect(reopen(storage).user()).toBeUndefined()
	})

	it('treats storage failures as a lost optimization', () => {
		const storage = {
			...memoryStorage(),
			setItem: () => {
				throw new DOMException('quota', 'QuotaExceededError')
			},
		}
		const snapshots = createSnapshots<User>(storage, '1.0.0')
		expect(() => snapshots.confirm(alice)).not.toThrow()
		expect(() => snapshots.write('todos:list:{}', [])).not.toThrow()
	})
})
