import { drizzleAdapter } from '@better-auth/drizzle-adapter'
import { betterAuth } from 'better-auth'

import type { Database } from '@/db'
import * as authSchema from '@/db/schema/auth'

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
