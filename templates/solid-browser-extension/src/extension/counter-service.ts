import type { CounterCommand, CounterState } from './protocol'

import { getCounter, incrementCounter, resetCounter } from './counter-store'

let operation = Promise.resolve()

export function handleCounterCommand(
	command: CounterCommand,
): Promise<CounterState> {
	// storage.local has no atomic increment primitive. Serialize commands inside
	// one worker lifetime so concurrent UI events cannot overwrite each other.
	const result = operation.then(() => executeCounterCommand(command))
	operation = result.then(
		() => undefined,
		() => undefined,
	)
	return result
}

async function executeCounterCommand(
	command: CounterCommand,
): Promise<CounterState> {
	let count: number

	switch (command.type) {
		case 'counter:get':
			count = await getCounter()
			break
		case 'counter:increment':
			count = await incrementCounter()
			break
		case 'counter:reset':
			count = await resetCounter()
			break
	}

	return {
		count,
		type: 'counter:state',
	}
}
