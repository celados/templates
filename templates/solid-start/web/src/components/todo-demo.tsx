import * as stylex from '@stylexjs/stylex'
import {
	action,
	createOptimistic,
	createSignal,
	For,
	Loading,
	Show,
	useContext,
} from 'solid-js'

import type { Id } from '../../../convex/_generated/dataModel'

import { api } from '../../../convex/_generated/api'
import { AuthContext } from '../lib/auth'
import { createConvexQuery, useConvexClient } from '../lib/convex'
import { ui } from '../styles/ui'

export function TodoDemo() {
	const auth = useContext(AuthContext)
	return (
		<article {...stylex.attrs(ui.card)}>
			<p {...stylex.attrs(ui.eyebrow)}>Convex</p>
			<h2 {...stylex.attrs(ui.heading)}>Reactive todos</h2>
			<Show
				when={auth.user$()}
				fallback={
					<p {...stylex.attrs(ui.muted)}>
						Sign in to exercise authenticated queries and mutations.
					</p>
				}
			>
				<Todos />
			</Show>
		</article>
	)
}

// Mounted only once the user is known, so the subscription starts with a token.
function Todos() {
	const client = useConvexClient()
	const todos$ = createConvexQuery(api.todos.list, () => ({}))
	const [text, setText] = createSignal('')
	const [adding, setAdding] = createOptimistic(false)
	const [error, setError] = createSignal<string>()

	// No optimistic list writes: the live query is the authority and lands the
	// confirmed row itself, so there is nothing to reconcile.
	const add = action(function* (value: string) {
		setAdding(true)
		yield client.mutation(api.todos.create, { text: value })
		setText('')
	})
	const run = (work: Promise<unknown>) => {
		setError(undefined)
		work.catch((cause: Error) => setError(cause.message))
	}
	const toggle = (id: Id<'todos'>) =>
		run(client.mutation(api.todos.toggle, { id }))
	const remove = (id: Id<'todos'>) =>
		run(client.mutation(api.todos.remove, { id }))

	return (
		<>
			<form
				{...stylex.attrs(ui.row)}
				onSubmit={(event) => {
					event.preventDefault()
					if (text().trim()) run(add(text()))
				}}
			>
				<input
					{...stylex.attrs(ui.input, ui.grow)}
					aria-label="New todo"
					placeholder="Ship something useful"
					value={text()}
					onInput={(event) => setText(event.currentTarget.value)}
				/>
				<button type="submit" {...stylex.attrs(ui.button)} disabled={adding()}>
					Add
				</button>
			</form>
			<Loading fallback={<p {...stylex.attrs(ui.muted)}>Loading todos…</p>}>
				<ul {...stylex.attrs(ui.list)}>
					{/* Every snapshot carries fresh objects; key by id so rows survive updates. */}
					<For
						each={todos$()}
						keyed={(todo) => todo._id}
						fallback={<li {...stylex.attrs(ui.muted)}>No todos yet.</li>}
					>
						{(todo) => (
							<li {...stylex.attrs(ui.row, ui.todo)}>
								<button
									type="button"
									{...stylex.attrs(ui.plain, todo().completed && ui.done)}
									onClick={() => toggle(todo()._id)}
								>
									{todo().text}
								</button>
								<button
									type="button"
									{...stylex.attrs(ui.button, ui.ghost)}
									onClick={() => remove(todo()._id)}
								>
									Remove
								</button>
							</li>
						)}
					</For>
				</ul>
			</Loading>
			<Show when={error()}>
				{(message) => (
					<p role="alert" {...stylex.attrs(ui.error)}>
						{message()}
					</p>
				)}
			</Show>
		</>
	)
}
