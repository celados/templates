import { contract } from '@app/api-contract'
import { implement, onFinish, ORPCError, os, withEventMeta } from '@orpc/server'
import { desc, eq } from 'drizzle-orm'

import { createAuth } from '@/auth'
import { todo, withDatabase } from '@/db'

import type { RpcContext } from './context'

const contractImplementer = implement(contract).$context<RpcContext>()

const traceMiddleware = os
	.$context<RpcContext>()
	.middleware(async ({ context, next, path }) => {
		const startedAt = performance.now()

		try {
			return await next()
		} finally {
			context.log.set({
				rpc: {
					durationMs: Math.round(performance.now() - startedAt),
					path: path.join('.'),
					requestId: context.requestId,
				},
			})
		}
	})

const databaseMiddleware = os
	.$context<RpcContext>()
	.middleware(async ({ context, next }) => {
		return withDatabase(context.env.HYPERDRIVE.connectionString, async (db) => {
			return next({ context: { db } })
		})
	})

const publicProcedures = contractImplementer.use(traceMiddleware)
const databaseProcedures = publicProcedures.use(databaseMiddleware)

const health = publicProcedures.system.health.handler(() => ({
	ok: true,
	service: 'cloudflare-worker-template',
}))

const viewer = databaseProcedures.auth.viewer.handler(
	async ({ context, errors }) => {
		const auth = createAuth({
			baseUrl: context.env.BETTER_AUTH_URL,
			db: context.db,
			secret: context.env.BETTER_AUTH_SECRET,
			trustedOrigin: context.env.CORS_ORIGIN,
		})
		const session = await auth.api.getSession({
			headers: context.request.headers,
		})

		if (!session) {
			throw errors.UNAUTHORIZED()
		}

		return {
			email: session.user.email,
			id: session.user.id,
			name: session.user.name,
		}
	},
)

const listTodos = databaseProcedures.todos.list.handler(async ({ context }) => {
	return context.db.select().from(todo).orderBy(desc(todo.createdAt))
})

const getTodo = databaseProcedures.todos.get.handler(
	async ({ context, errors, input }) => {
		const [record] = await context.db
			.select()
			.from(todo)
			.where(eq(todo.id, input.id))
			.limit(1)

		if (!record) {
			throw errors.NOT_FOUND({ data: { id: input.id } })
		}

		return record
	},
)

const createTodo = databaseProcedures.todos.create.handler(
	async ({ context, input }) => {
		const [record] = await context.db
			.insert(todo)
			.values({
				id: crypto.randomUUID(),
				title: input.title,
			})
			.returning()

		if (!record) {
			throw new ORPCError('INTERNAL_SERVER_ERROR')
		}

		return record
	},
)

const updateTodo = databaseProcedures.todos.update.handler(
	async ({ context, errors, input }) => {
		const [record] = await context.db
			.update(todo)
			.set({
				completed: input.completed,
				title: input.title,
			})
			.where(eq(todo.id, input.id))
			.returning()

		if (!record) {
			throw errors.NOT_FOUND({ data: { id: input.id } })
		}

		return record
	},
)

const deleteTodo = databaseProcedures.todos.delete.handler(
	async ({ context, errors, input }) => {
		const [record] = await context.db
			.delete(todo)
			.where(eq(todo.id, input.id))
			.returning({ id: todo.id })

		if (!record) {
			throw errors.NOT_FOUND({ data: { id: input.id } })
		}

		return record
	},
)

const ticks = publicProcedures.events.ticks
	.use(
		onFinish((state) => {
			console.info(JSON.stringify({ event: 'ticks.finished', state }))
		}),
	)
	.handler(async function* ({ input, lastEventId, signal }) {
		const resumedAt = Number.parseInt(lastEventId ?? '0', 10)
		const start = Number.isFinite(resumedAt) ? resumedAt : 0

		for (let index = start; index < input.count; index += 1) {
			if (signal?.aborted) {
				return
			}

			const sequence = index + 1
			yield withEventMeta(
				{
					emittedAt: new Date().toISOString(),
					message: `${input.message} ${sequence}`,
					sequence,
				},
				{
					id: String(sequence),
					retry: 1_000,
				},
			)

			await new Promise((resolve) => setTimeout(resolve, input.intervalMs))
		}
	})

const inspectFile = publicProcedures.files.inspect.handler(
	async ({ input }) => {
		const digest = await crypto.subtle.digest(
			'SHA-256',
			await input.file.arrayBuffer(),
		)

		return {
			label: input.label,
			name: input.file.name,
			sha256: [...new Uint8Array(digest)]
				.map((byte) => byte.toString(16).padStart(2, '0'))
				.join(''),
			size: input.file.size,
			type: input.file.type,
		}
	},
)

const downloadFile = publicProcedures.files.download.handler(({ input }) => {
	return new File([input.content], input.name, {
		type: 'text/plain;charset=utf-8',
	})
})

export const router = contractImplementer.router({
	auth: {
		viewer,
	},
	events: {
		ticks,
	},
	files: {
		download: downloadFile,
		inspect: inspectFile,
	},
	system: {
		health,
	},
	todos: {
		create: createTodo,
		delete: deleteTodo,
		get: getTodo,
		list: listTodos,
		update: updateTodo,
	},
})
