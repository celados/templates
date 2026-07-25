import { drizzle } from 'drizzle-orm/node-postgres'
import { Client } from 'pg'

import * as schema from './schema'

function createDatabase(client: Client) {
	return drizzle({
		client,
		schema,
	})
}

export type Database = ReturnType<typeof createDatabase>

export async function withDatabase<Result>(
	connectionString: string,
	operation: (db: Database) => Promise<Result>,
): Promise<Result> {
	// Hyperdrive owns pooling, so request-scoped pg clients stay cheap and cannot leak.
	const client = new Client({ connectionString })
	await client.connect()

	try {
		return await operation(createDatabase(client))
	} finally {
		await client.end()
	}
}

export { todo } from './schema/todo'
