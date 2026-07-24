export type CounterCommand =
	| Readonly<{ type: 'counter:get' }>
	| Readonly<{ type: 'counter:increment' }>
	| Readonly<{ type: 'counter:reset' }>

export type CounterState = Readonly<{
	count: number
	type: 'counter:state'
}>

export function isCounterCommand(value: unknown): value is CounterCommand {
	if (typeof value !== 'object' || value === null || !('type' in value)) {
		return false
	}

	const { type } = value
	return (
		type === 'counter:get' ||
		type === 'counter:increment' ||
		type === 'counter:reset'
	)
}
