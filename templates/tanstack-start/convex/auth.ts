import { createClient, type GenericCtx } from '@convex-dev/better-auth'
import { convex } from '@convex-dev/better-auth/plugins'
import { betterAuth, type BetterAuthOptions } from 'better-auth/minimal'
import { magicLink } from 'better-auth/plugins/magic-link'
import { ConvexError } from 'convex/values'

import type { DataModel } from './_generated/dataModel'
import type { ActionCtx, MutationCtx, QueryCtx } from './_generated/server'

import { components } from './_generated/api'
import { internalAction, query } from './_generated/server'
import authConfig from './auth.config'
import { sendMagicLinkEmail } from './auth_email'

export const authComponent = createClient<DataModel>(components.betterAuth)

export const createAuthOptions = (ctx: GenericCtx<DataModel>) => {
	const siteUrl = requireEnvironment('SITE_URL')

	return {
		baseURL: siteUrl,
		secret: requireEnvironment('BETTER_AUTH_SECRET'),
		trustedOrigins: [siteUrl],
		database: authComponent.adapter(ctx),
		socialProviders: {
			google: {
				clientId: requireEnvironment('GOOGLE_CLIENT_ID'),
				clientSecret: requireEnvironment('GOOGLE_CLIENT_SECRET'),
			},
		},
		// Convex provides the shared atomic store that serverless memory cannot.
		// Source: https://www.better-auth.com/docs/concepts/rate-limit
		rateLimit: {
			enabled: true,
			storage: 'database',
		},
		advanced: {
			ipAddress: {
				// Cloudflare replaces this header, so callers cannot spoof the key.
				// Source: https://developers.cloudflare.com/fundamentals/reference/http-request-headers/#cf-connecting-ip
				ipAddressHeaders: ['cf-connecting-ip'],
			},
		},
		plugins: [
			magicLink({
				sendMagicLink: async (data) => {
					await sendMagicLinkEmail(data)
				},
				storeToken: 'hashed',
				rateLimit: {
					window: 60,
					max: 3,
				},
			}),
			convex({
				authConfig,
				// Undefined keeps the remote fallback until each deployment is bootstrapped.
				jwks: process.env.JWKS,
			}),
		],
	} satisfies BetterAuthOptions
}

export const createAuth = (ctx: GenericCtx<DataModel>) =>
	betterAuth(createAuthOptions(ctx))

export const getLatestJwks = internalAction({
	args: {},
	handler: async (ctx) => {
		const auth = createAuth(ctx)
		return await auth.api.getLatestJwks()
	},
})

type AuthContext = Pick<QueryCtx | MutationCtx | ActionCtx, 'auth'>

export async function requireIdentity(ctx: AuthContext) {
	const identity = await ctx.auth.getUserIdentity()
	if (!identity) {
		throw new ConvexError('Unauthenticated')
	}
	return identity
}

export const currentUser = query({
	args: {},
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity()
		if (!identity) {
			return null
		}

		// Expose only UI-safe identity fields instead of forwarding the whole JWT.
		return {
			id: identity.subject,
			email: identity.email,
			name: identity.name,
		}
	},
})

function requireEnvironment(name: string) {
	const value = process.env[name]
	if (!value) {
		throw new Error(`${name} is required`)
	}
	return value
}
