/**
 * The text to show for a failure an action caught; thrown values are not always
 * Errors.
 */
export function errorMessage(cause: unknown) {
	return cause instanceof Error ? cause.message : String(cause)
}
