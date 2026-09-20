import { boolean, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

export const todo = pgTable('todo', {
	completed: boolean('completed').default(false).notNull(),
	createdAt: timestamp('created_at', {
		mode: 'string',
		withTimezone: true,
	})
		.defaultNow()
		.notNull(),
	id: text('id').primaryKey(),
	title: text('title').notNull(),
})
