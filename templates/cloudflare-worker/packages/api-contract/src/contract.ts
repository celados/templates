import { asyncIteratorObject, oc, type } from '@orpc/contract'
import * as v from 'valibot'

export type TodoOutput = {
	completed: boolean
	createdAt: string
	id: string
	title: string
}

export type ViewerOutput = {
	email: string
	id: string
	name: string
}

export type TickOutput = {
	emittedAt: string
	message: string
	sequence: number
}

export type InspectFileOutput = {
	label: string
	name: string
	sha256: string
	size: number
	type: string
}

export type DownloadFileOutput = File

export type HealthOutput = {
	ok: true
	service: 'cloudflare-worker-template'
}

export type DeleteTodoOutput = {
	id: string
}

export type ListTodosOutput = TodoOutput[]

const notFoundError = {
	NOT_FOUND: {
		message: 'Todo not found',
		data: v.strictObject({
			id: v.string(),
		}),
	},
}

export const contract = {
	auth: {
		viewer: oc.output(type<ViewerOutput>()).errors({
			UNAUTHORIZED: {
				message: 'Authentication required',
			},
		}),
	},
	events: {
		ticks: oc
			.input(
				v.strictObject({
					count: v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(10)),
					intervalMs: v.pipe(
						v.number(),
						v.integer(),
						v.minValue(1),
						v.maxValue(5_000),
					),
					message: v.pipe(v.string(), v.minLength(1), v.maxLength(100)),
				}),
			)
			.output(asyncIteratorObject(type<TickOutput>())),
	},
	files: {
		download: oc
			.input(
				v.strictObject({
					content: v.pipe(v.string(), v.maxLength(100_000)),
					name: v.pipe(v.string(), v.minLength(1), v.maxLength(120)),
				}),
			)
			.output(type<DownloadFileOutput>()),
		inspect: oc
			.input(
				v.strictObject({
					file: v.file(),
					label: v.pipe(v.string(), v.minLength(1), v.maxLength(100)),
				}),
			)
			.output(type<InspectFileOutput>()),
	},
	system: {
		health: oc.output(type<HealthOutput>()),
	},
	todos: {
		create: oc
			.input(
				v.strictObject({
					title: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
				}),
			)
			.output(type<TodoOutput>()),
		delete: oc
			.input(v.strictObject({ id: v.string() }))
			.output(type<DeleteTodoOutput>())
			.errors(notFoundError),
		get: oc
			.input(v.strictObject({ id: v.string() }))
			.output(type<TodoOutput>())
			.errors(notFoundError),
		list: oc.output(type<ListTodosOutput>()),
		update: oc
			.input(
				v.strictObject({
					completed: v.boolean(),
					id: v.string(),
					title: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
				}),
			)
			.output(type<TodoOutput>())
			.errors(notFoundError),
	},
}
