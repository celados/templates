import type { FunctionReference } from 'convex/server'

import { getFunctionName } from 'convex/server'
import { convexToJson, type JSONValue, type Value } from 'convex/values'

const STORAGE_KEY = 'convex-snapshots'

type Owner = { id: string }

type Stored<User extends Owner> = {
	version: string
	user: User
	queries: Record<string, JSONValue>
}

/**
 * The last live answers each query gave this person, kept so a UI opens on them
 * instead of waiting for the socket. They are provisional first paint, never
 * the authority: Convex replaces every one as soon as it answers.
 *
 * All snapshots belong to one user. Until the live `currentUser` confirms who
 * is signed in, writes are held in memory; a different user or a signed-out
 * answer discards everything, so one person's data never reaches another's
 * first paint.
 *
 * `version` is the extension version: a release may change what a query
 * returns, so snapshots from another version are dropped instead of rendered.
 * Storage failures (quota, disabled storage) only lose the optimization.
 */
export function createSnapshots<User extends Owner>(
	storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>,
	version: string,
) {
	let stored = load()
	let confirmed = false
	const pending = new Map<string, JSONValue>()

	function load(): Stored<User> | undefined {
		try {
			const value = JSON.parse(
				storage.getItem(STORAGE_KEY) ?? 'null',
			) as Stored<User> | null
			return value?.version === version ? value : undefined
		} catch {
			return undefined
		}
	}

	function save() {
		try {
			if (stored) storage.setItem(STORAGE_KEY, JSON.stringify(stored))
			else storage.removeItem(STORAGE_KEY)
		} catch {
			// First paint falls back to Loading; the live data is unaffected.
		}
	}

	return {
		/** The user the stored snapshots belong to, if any. */
		user: (): User | undefined => stored?.user,
		read: (key: string): JSONValue | undefined => stored?.queries[key],
		write(key: string, value: JSONValue) {
			if (!confirmed || !stored) {
				pending.set(key, value)
				return
			}
			stored.queries[key] = value
			save()
		},
		/** Record the live `currentUser` answer; null means signed out. */
		confirm(user: User | null) {
			if (user === null) {
				stored = undefined
				confirmed = false
			} else if (stored?.user.id === user.id) {
				stored.user = user
				for (const [key, value] of pending) stored.queries[key] = value
				confirmed = true
			} else {
				// Held values may predate the switch and belong to the previous
				// user; the next live answers repopulate the new owner's snapshots.
				stored = { version, user, queries: {} }
				confirmed = true
			}
			pending.clear()
			save()
		},
	}
}

/** Snapshot identity of one query call. */
export function snapshotKey(
	query: FunctionReference<'query'>,
	args: Record<string, Value>,
): string {
	return `${getFunctionName(query)}:${JSON.stringify(convexToJson(args))}`
}
