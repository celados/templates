/**
 * Extension messaging JSON-serializes arguments, which turns an Error into
 * `{}`. UI contexts flatten errors into this shape before sending them.
 */
export type ErrorReport = Readonly<{
	context: string
	message: string
	name: string
	stack?: string
}>

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

export function parseErrorReport(value: unknown): ErrorReport | undefined {
	if (typeof value !== 'object' || value === null) return undefined
	const { context, message, name, stack } = value as Record<string, unknown>
	if (
		typeof context !== 'string' ||
		typeof message !== 'string' ||
		typeof name !== 'string' ||
		(stack !== undefined && typeof stack !== 'string')
	) {
		return undefined
	}
	return { context, message, name, stack }
}
