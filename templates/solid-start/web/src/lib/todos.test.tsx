import { captureArtifact, expectNoDiagnostics } from '@solidjs/diagnostics'
import { createEffect, createRoot, flush } from 'solid-js'
import { describe, expect, it } from 'vite-plus/test'

import type { Id } from '../../../convex/_generated/dataModel'

import { createTodos, type TodosClient } from './todos'

type Row = { _id: Id<'todos'>; text: string; completed: boolean }

const id = (value: string) => value as Id<'todos'>
const row = (key: string, completed = false): Row => ({
	_id: id(key),
	text: key.toUpperCase(),
	completed,
})

// Convex's order when a mutation lands: its promise resolves, then — in the
// same synchronous step — subscribed listeners receive the snapshot that
// includes it. A new listener on a cached query gets the current value on a
// zero-delay timer. `land` and `onUpdate` reproduce both.
function fakeConvex() {
	let current: Row[] | undefined
	const listeners = new Set<(rows: Row[]) => void>()
	const pending: {
		resolve: (value: unknown) => void
		reject: (error: Error) => void
	}[] = []
	const publish = (rows: Row[]) => {
		current = rows
		for (const listener of listeners) listener(rows)
	}
	const client = {
		onUpdate(_query: unknown, _args: unknown, callback: (rows: Row[]) => void) {
			listeners.add(callback)
			if (current) {
				const cached = current
				setTimeout(() => listeners.has(callback) && callback(cached), 0)
			}
			return Object.assign(() => listeners.delete(callback), {
				getCurrentValue: () => current,
			})
		},
		mutation() {
			return new Promise((resolve, reject) => pending.push({ resolve, reject }))
		},
	} as unknown as TodosClient
	return {
		client,
		publish,
		land(index: number, rows: Row[]) {
			pending[index]!.resolve(null)
			publish(rows)
		},
		fail(index: number, message: string) {
			pending[index]!.reject(new Error(message))
		},
	}
}

// Lets microtasks, the cached-value timer, and the reactive flush all run.
const settle = async () => {
	for (let i = 0; i < 3; i++) {
		await new Promise((resolve) => setTimeout(resolve, 0))
		flush()
	}
}

// Every value the UI committed, so a flicker shows up as an extra entry.
function mount(client: TodosClient) {
	const seen: string[] = []
	let todos!: ReturnType<typeof createTodos>
	const dispose = createRoot((dispose) => {
		todos = createTodos(client)
		createEffect(
			() =>
				todos.list$.map((todo) => `${todo._id}:${todo.completed}`).join(' '),
			(value) => {
				seen.push(value)
			},
		)
		return dispose
	})
	return { todos, seen, dispose }
}

describe('todos store', () => {
	it('confirms an optimistic toggle without flashing the old value', async () => {
		const { artifact } = await captureArtifact(
			async () => {
				const convex = fakeConvex()
				const { todos, seen, dispose } = mount(convex.client)
				convex.publish([row('a')])
				await settle()
				expect(seen).toEqual(['a:false'])

				void todos.toggle(id('a'))
				await settle()
				expect(seen.at(-1)).toBe('a:true')

				convex.land(0, [row('a', true)])
				await settle()
				expect(seen).toEqual(['a:false', 'a:true'])
				dispose()
			},
			{ scenario: 'todo-toggle-confirmed' },
		)
		expectNoDiagnostics(artifact)
	})

	it('reverts a failed toggle and reports it', async () => {
		const { artifact } = await captureArtifact(
			async () => {
				const convex = fakeConvex()
				const { todos, seen, dispose } = mount(convex.client)
				convex.publish([row('a')])
				await settle()

				const outcome = todos.toggle(id('a'))
				await settle()
				expect(seen.at(-1)).toBe('a:true')

				convex.fail(0, 'Todo not found')
				await outcome
				await settle()
				expect(seen.at(-1)).toBe('a:false')
				expect(todos.error()).toBe('Todo not found')
				dispose()
			},
			{ scenario: 'todo-toggle-failed' },
		)
		expectNoDiagnostics(artifact)
	})

	it('settles overlapping mutations in either order', async () => {
		const { artifact } = await captureArtifact(
			async () => {
				const convex = fakeConvex()
				const { todos, seen, dispose } = mount(convex.client)
				convex.publish([row('a'), row('b')])
				await settle()

				void todos.toggle(id('a'))
				void todos.remove(id('b'))
				await settle()
				expect(seen.at(-1)).toBe('a:true')

				// The later mutation lands first; the earlier overlay must survive it.
				convex.land(1, [row('a')])
				await settle()
				expect(seen.at(-1)).toBe('a:true')

				convex.land(0, [row('a', true)])
				await settle()
				expect(seen.at(-1)).toBe('a:true')
				// After the first optimistic frame, `a` never shows unchecked again.
				expect(seen.slice(1).some((value) => value.startsWith('a:false'))).toBe(
					false,
				)
				dispose()
			},
			{ scenario: 'todo-overlap' },
		)
		expectNoDiagnostics(artifact)
	})

	it('reports add failure without clearing the caller', async () => {
		const convex = fakeConvex()
		const { todos, dispose } = mount(convex.client)
		convex.publish([])
		await settle()

		const outcome = todos.add('draft')
		await settle()
		expect(todos.adding()).toBe(true)
		convex.fail(0, 'Todo text is required')
		expect(await outcome).toBe(false)
		await settle()
		expect(todos.adding()).toBe(false)
		expect(todos.error()).toBe('Todo text is required')
		dispose()
	})
})
