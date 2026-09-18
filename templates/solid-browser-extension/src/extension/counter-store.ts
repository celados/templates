import { storage } from '#imports'

export const counterItem = storage.defineItem<number>('local:counter', {
	fallback: 0,
	version: 1,
})

export async function getCounter(): Promise<number> {
	return counterItem.getValue()
}

export async function incrementCounter(): Promise<number> {
	const count = (await counterItem.getValue()) + 1
	await counterItem.setValue(count)
	return count
}

export async function resetCounter(): Promise<number> {
	await counterItem.setValue(0)
	return 0
}
