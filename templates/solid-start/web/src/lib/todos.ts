import type { ConvexClient } from 'convex/browser'
import type { FunctionReturnType } from 'convex/server'

import {
	action,
	createContext,
	createOptimistic,
	createOptimisticStore,
	createSignal,
	refresh,
} from 'solid-js'

import type { Id } from '../../../convex/_generated/dataModel'

import { api } from '../../../convex/_generated/api'
import { querySource } from './convex'
import { errorMessage } from './error-message'

type Todo = FunctionReturnType<typeof api.todos.list>[number]

/** The client surface the store needs; tests pass a fake with the same shape. */
export type TodosClient = Pick<ConvexClient, 'onUpdate' | 'mutation'>

/**
 * One store for the todos screen: the live list, the process the user watches,
 * and one action per intent. Components read it through `TodosContext` and keep
 * only their own control state (the input's draft text).
 *
 * Each action holds until the list carries its write, so its optimistic
 * overrides drop onto confirmed data instead of flashing the old value. The
 * mutation's own promise is not that point: Convex resolves it before handing
 * the matching snapshot to query listeners, so the action would settle one step
 * early. `yield refresh(list$)` re-asks and waits for the answer, which Convex
 * serves from its local cache. `todos.test.tsx` pins the ordering.
 */
export function createTodos(client: TodosClient) {
	// The live query is the authority; optimistic writes are overlays on it that
	// last exactly as long as the action that made them.
	const [list$, setList] = createOptimisticStore<Todo[]>(
		() => querySource(client, api.todos.list, {}),
		[],
		{ key: '_id' },
	)
	const [adding, setAdding] = createOptimistic(false)
	const [error, setError] = createSignal<string>()

	// A failed mutation settles its action without truth changing, so the
	// overlay reverts on its own; the action only has to say what went wrong.
	// Returning the outcome lets a caller clear its own control state on success.
	function* confirmed(work: Promise<unknown>) {
		try {
			yield work
			yield refresh(list$)
			setError(undefined)
			return true
		} catch (cause) {
			setError(errorMessage(cause))
			return false
		}
	}

	// No optimistic row for a new todo: the server assigns its id and position,
	// and a guessed row would be replaced rather than confirmed.
	const add = action(function* (text: string) {
		setAdding(true)
		return yield* confirmed(client.mutation(api.todos.create, { text }))
	})

	const toggle = action(function* (id: Id<'todos'>) {
		setList((list) => {
			const todo = list.find((item) => item._id === id)
			if (todo) todo.completed = !todo.completed
		})
		yield* confirmed(client.mutation(api.todos.toggle, { id }))
	})

	// Optimistic removal is safe here: the row owns nothing that outlives it (no
	// popover, focus trap, or deferred DOM read). Confirm first when it does.
	const remove = action(function* (id: Id<'todos'>) {
		setList((list) => {
			const index = list.findIndex((item) => item._id === id)
			if (index >= 0) list.splice(index, 1)
		})
		yield* confirmed(client.mutation(api.todos.remove, { id }))
	})

	return { list$, adding, error, add, toggle, remove }
}

type Todos = ReturnType<typeof createTodos>

export const TodosContext = createContext<Todos>(undefined, {
	name: 'TodosContext',
})
