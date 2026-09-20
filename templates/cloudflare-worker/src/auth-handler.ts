import { createAuth } from '@/auth'
import { withDatabase } from '@/db'

import type { WorkerBindings } from './context'

export async function handleAuthRequest(
	request: Request,
	env: WorkerBindings,
): Promise<Response> {
	return withDatabase(env.HYPERDRIVE.connectionString, async (db) => {
		const auth = createAuth({
			baseUrl: env.BETTER_AUTH_URL,
			db,
			secret: env.BETTER_AUTH_SECRET,
			trustedOrigin: env.CORS_ORIGIN,
		})

		return auth.handler(request)
	})
}
