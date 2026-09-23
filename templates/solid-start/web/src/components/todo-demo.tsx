import * as stylex from '@stylexjs/stylex'
import { createSignal, For, Loading, Show, useContext } from 'solid-js'

import { AuthContext } from '../lib/auth'
import { useConvexClient } from '../lib/convex'
import { createTodos, TodosContext } from '../lib/todos'
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
// The store lives in this owner, above the Loading that waits on it.
function Todos() {
	const todos = createTodos(useConvexClient())
	return (
		<TodosContext value={todos}>
			<TodoForm />
			<Loading fallback={<p {...stylex.attrs(ui.muted)}>Loading todos…</p>}>
				<TodoList />
			</Loading>
			<Show when={todos.error()}>
				{(message) => (
					<p role="alert" {...stylex.attrs(ui.error)}>
						{message()}
					</p>
				)}
			</Show>
		</TodosContext>
	)
}

function TodoForm() {
	const todos = useContext(TodosContext)
	// The draft is this control's own state; the store never needs it.
	const [text, setText] = createSignal('')
	return (
		<form
			{...stylex.attrs(ui.row)}
			onSubmit={(event) => {
				event.preventDefault()
				const value = text().trim()
				if (!value) return
				void todos.add(value).then((added) => added && setText(''))
			}}
		>
			<input
				{...stylex.attrs(ui.input, ui.grow)}
				aria-label="New todo"
				placeholder="Ship something useful"
				value={text()}
				onInput={(event) => setText(event.currentTarget.value)}
			/>
			<button
				type="submit"
				{...stylex.attrs(ui.button)}
				disabled={todos.adding()}
			>
				Add
			</button>
		</form>
	)
}

function TodoList() {
	const todos = useContext(TodosContext)
	return (
		<ul {...stylex.attrs(ui.list)}>
			{/* Every snapshot carries fresh objects; key by id so rows survive updates. */}
			<For
				each={todos.list$}
				keyed={(todo) => todo._id}
				fallback={<li {...stylex.attrs(ui.muted)}>No todos yet.</li>}
			>
				{(todo) => (
					<li {...stylex.attrs(ui.row, ui.todo)}>
						<button
							type="button"
							{...stylex.attrs(ui.plain, todo().completed && ui.done)}
							onClick={() => void todos.toggle(todo()._id)}
						>
							{todo().text}
						</button>
						<button
							type="button"
							{...stylex.attrs(ui.button, ui.ghost)}
							onClick={() => void todos.remove(todo()._id)}
						>
							Remove
						</button>
					</li>
				)}
			</For>
		</ul>
	)
}
