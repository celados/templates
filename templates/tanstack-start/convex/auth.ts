import { createClient, type GenericCtx } from '@convex-dev/better-auth'
import { convex } from '@convex-dev/better-auth/plugins'
import { betterAuth, type BetterAuthOptions } from 'better-auth/minimal'
import { ConvexError } from 'convex/values'

import type { DataModel } from './_generated/dataModel'
import type { ActionCtx, MutationCtx, QueryCtx } from './_generated/server'

import { components } from './_generated/api'
import { query } from './_generated/server'
import authConfig from './auth.config'

const siteUrl = process.env.SITE_URL

export const authComponent = createClient<DataModel>(components.betterAuth)

export const createAuthOptions = (ctx: GenericCtx<DataModel>) =>
	({
		baseURL: siteUrl,
		secret: process.env.BETTER_AUTH_SECRET,
		trustedOrigins: siteUrl ? [siteUrl] : [],
		database: authComponent.adapter(ctx),
		emailAndPassword: {
			enabled: true,
		},
		plugins: [convex({ authConfig })],
	}) satisfies BetterAuthOptions

export const createAuth = (ctx: GenericCtx<DataModel>) =>
	betterAuth(createAuthOptions(ctx))

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
