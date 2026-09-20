import { counterItem } from './counter-store'

/**
 * Background-owned counter mutations. Callers receive the new count, but UI
 * renders the storage watch, so the return value is a confirmation only.
 */
export function createCounterService() {
	let operation = Promise.resolve()

	// storage.local has no atomic increment primitive. Serialize writes inside
	// one worker lifetime so concurrent UI events cannot overwrite each other.
	function serialize(write: () => Promise<number>): Promise<number> {
		const result = operation.then(write)
		operation = result.then(
			() => undefined,
			() => undefined,
		)
		return result
	}

	return {
		increment: () =>
			serialize(async () => {
				const count = (await counterItem.getValue()) + 1
				await counterItem.setValue(count)
				return count
			}),
		reset: () =>
			serialize(async () => {
				await counterItem.setValue(0)
				return 0
			}),
	}
}
