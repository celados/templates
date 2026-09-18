import { browser } from '#imports'

import type { CounterCommand, CounterState } from './protocol'

import { counterItem } from './counter-store'

export async function sendCounterCommand(
	command: CounterCommand,
): Promise<CounterState> {
	const response: unknown = await browser.runtime.sendMessage(command)

	if (
		typeof response !== 'object' ||
		response === null ||
		!('type' in response) ||
		response.type !== 'counter:state' ||
		!('count' in response) ||
		typeof response.count !== 'number'
	) {
		throw new Error('Background returned an invalid counter response')
	}

	return response as CounterState
}

export function watchCounter(listener: (count: number) => void): () => void {
	return counterItem.watch((count) => {
		listener(count)
	})
}
