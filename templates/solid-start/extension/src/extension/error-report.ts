import * as v from 'valibot'

/**
 * Native Errors do not survive extension messaging, so UI contexts flatten them
 * into this shape before forwarding them to the background.
 */
export const errorReportSchema = v.object({
	context: v.string(),
	message: v.string(),
	name: v.string(),
	stack: v.optional(v.string()),
})

export type ErrorReport = v.InferOutput<typeof errorReportSchema>

export function toErrorReport(error: unknown, context: string): ErrorReport {
	if (error instanceof Error) {
		return {
			context,
			message: error.message,
			name: error.name,
			stack: error.stack,
		}
	}
	return { context, message: String(error), name: 'NonError' }
}
