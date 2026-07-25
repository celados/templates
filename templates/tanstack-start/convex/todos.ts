import { ConvexError, v } from 'convex/values'

import { mutation, query } from './_generated/server'
import { requireIdentity } from './auth'

export const list = query({
	args: {},
	handler: async (ctx) => {
		const identity = await requireIdentity(ctx)
		return ctx.db
			.query('todos')
			.withIndex('by_owner', (queryBuilder) =>
				queryBuilder.eq('ownerId', identity.subject),
			)
			.order('desc')
			.collect()
	},
})

export const create = mutation({
	args: {
		text: v.string(),
	},
	handler: async (ctx, args) => {
		const identity = await requireIdentity(ctx)
		const text = args.text.trim()
		if (!text) {
			throw new ConvexError('Todo text is required')
		}

		return ctx.db.insert('todos', {
			ownerId: identity.subject,
			text,
			completed: false,
		})
	},
})

export const toggle = mutation({
	args: {
		id: v.id('todos'),
	},
	handler: async (ctx, args) => {
		const identity = await requireIdentity(ctx)
		const todo = await ctx.db.get(args.id)
		if (!todo || todo.ownerId !== identity.subject) {
			throw new ConvexError('Todo not found')
		}

		await ctx.db.patch(todo._id, {
			completed: !todo.completed,
		})
	},
})

export const remove = mutation({
	args: {
		id: v.id('todos'),
	},
	handler: async (ctx, args) => {
		const identity = await requireIdentity(ctx)
		const todo = await ctx.db.get(args.id)
		if (!todo || todo.ownerId !== identity.subject) {
			throw new ConvexError('Todo not found')
		}

		await ctx.db.delete(todo._id)
	},
})
