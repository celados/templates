import { storage } from '#imports'

export const counterItem = storage.defineItem<number>('local:counter', {
	fallback: 0,
	version: 1,
})
