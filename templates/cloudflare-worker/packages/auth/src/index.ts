import type { Database } from '@app/db'

import * as authSchema from '@app/db/schema/auth'
import { drizzleAdapter } from '@better-auth/drizzle-adapter'
import { betterAuth } from 'better-auth'

export type CreateAuthOptions = {
	baseUrl: string
	db: Database
	secret: string
	trustedOrigin: string
}

export function createAuth(options: CreateAuthOptions) {
	const { baseUrl, db, secret, trustedOrigin } = options

	return betterAuth({
		baseURL: baseUrl,
		database: drizzleAdapter(db, {
			provider: 'pg',
			schema: authSchema,
		}),
		emailAndPassword: {
			enabled: true,
		},
		secret,
		trustedOrigins: [trustedOrigin],
	})
}

export type Auth = ReturnType<typeof createAuth>
