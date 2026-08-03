import { convexQuery } from '@convex-dev/react-query'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useConvex, useConvexAuth } from 'convex/react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { api } from '~/convex/_generated/api'

export function TodoDemo() {
	const convex = useConvex()
	const auth = useConvexAuth()
	const [text, setText] = useState('')
	const todos = useQuery(
		convexQuery(api.todos.list, auth.isAuthenticated ? {} : 'skip'),
	)

	const createTodo = useMutation({
		mutationFn: (todoText: string) =>
			convex.mutation(api.todos.create, { text: todoText }),
		onSuccess: () => setText(''),
	})
	const toggleTodo = useMutation({
		mutationFn: (id: (typeof api.todos.toggle)['_args']['id']) =>
			convex.mutation(api.todos.toggle, { id }),
	})
	const removeTodo = useMutation({
		mutationFn: (id: (typeof api.todos.remove)['_args']['id']) =>
			convex.mutation(api.todos.remove, { id }),
	})

	return (
		<article className="rounded-2xl border bg-card p-5 text-card-foreground shadow-sm">
			<p className="text-xs font-medium text-muted-foreground">Convex</p>
			<h2 className="mt-2 text-xl font-semibold">Reactive todos</h2>
			{auth.isLoading ? (
				<p className="mt-4 text-sm text-muted-foreground">
					Checking the session…
				</p>
			) : !auth.isAuthenticated ? (
				<p className="mt-4 text-sm text-muted-foreground">
					Sign in to exercise authenticated queries and mutations.
				</p>
			) : (
				<>
					<form
						className="mt-5 flex gap-2"
						onSubmit={(event) => {
							event.preventDefault()
							if (text.trim()) {
								createTodo.mutate(text)
							}
						}}
					>
						<input
							className="h-9 min-w-0 flex-1 rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
							aria-label="New todo"
							placeholder="Ship something useful"
							value={text}
							onChange={(event) => setText(event.currentTarget.value)}
						/>
						<Button disabled={createTodo.isPending}>Add</Button>
					</form>
					<ul className="mt-4 space-y-2">
						{todos.data?.map((todo) => (
							<li
								className="flex items-center gap-2 rounded-lg border p-2"
								key={todo._id}
							>
								<button
									className="min-w-0 flex-1 text-left text-sm"
									type="button"
									onClick={() => toggleTodo.mutate(todo._id)}
								>
									<span
										className={
											todo.completed
												? 'text-muted-foreground line-through'
												: undefined
										}
									>
										{todo.text}
									</span>
								</button>
								<Button
									size="xs"
									variant="ghost"
									onClick={() => removeTodo.mutate(todo._id)}
								>
									Remove
								</Button>
							</li>
						))}
					</ul>
					{todos.data?.length === 0 ? (
						<p className="mt-4 text-sm text-muted-foreground">No todos yet.</p>
					) : null}
				</>
			)}
		</article>
	)
}
