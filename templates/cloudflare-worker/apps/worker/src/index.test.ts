import { createApiClient } from '@app/api-contract'
import { describe, expect, it } from 'vite-plus/test'

import type { WorkerBindings } from './context'

import { app } from './index'

const env = {
	BETTER_AUTH_SECRET: 'test-secret-that-is-long-enough-for-better-auth',
	BETTER_AUTH_URL: 'http://localhost:8787',
	CORS_ORIGIN: 'http://localhost:3000',
	HYPERDRIVE: {
		connectionString: 'postgresql://unused-in-these-tests',
	} as Hyperdrive,
} satisfies WorkerBindings

function createTestClient() {
	return createApiClient({
		fetch: async (request) => app.fetch(request, env),
		url: 'http://localhost:8787/rpc',
	})
}

describe('Worker oRPC surface', () => {
	it('serves the typed health procedure', async () => {
		const client = createTestClient()

		await expect(client.system.health()).resolves.toEqual({
			ok: true,
			service: 'cloudflare-worker-template',
		})
	})

	it('streams resumable event iterator output', async () => {
		const client = createTestClient()
		const iterator = await client.events.ticks({
			count: 2,
			intervalMs: 1,
			message: 'tick',
		})
		const events = []

		for await (const event of iterator) {
			events.push(event)
		}

		expect(events).toMatchObject([
			{ message: 'tick 1', sequence: 1 },
			{ message: 'tick 2', sequence: 2 },
		])
	})

	it('uploads and downloads standard File values', async () => {
		const client = createTestClient()
		const inspected = await client.files.inspect({
			file: new File(['hello'], 'hello.txt', { type: 'text/plain' }),
			label: 'fixture',
		})
		const downloaded = await client.files.download({
			content: 'hello',
			name: 'download.txt',
		})

		expect(inspected).toMatchObject({
			label: 'fixture',
			name: 'hello.txt',
			sha256:
				'2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824',
			size: 5,
			type: 'text/plain',
		})
		expect(downloaded.name).toBe('download.txt')
		expect(await downloaded.text()).toBe('hello')
	})
})
