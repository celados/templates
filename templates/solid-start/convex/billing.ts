import { StripeSubscriptions } from '@convex-dev/stripe'

import { components } from './_generated/api'
import { action, query } from './_generated/server'
import { requireIdentity } from './auth'

const stripe = new StripeSubscriptions(components.stripe)

function requireEnvironment(name: string) {
	const value = process.env[name]
	if (!value) {
		throw new Error(`${name} is not configured`)
	}
	return value
}

export const currentSubscription = query({
	args: {},
	handler: async (ctx) => {
		const identity = await requireIdentity(ctx)
		const subscriptions = await ctx.runQuery(
			components.stripe.public.listSubscriptionsByUserId,
			{ userId: identity.subject },
		)

		// Keep Stripe's internal record shape behind this module boundary.
		return subscriptions.map((subscription) => ({
			id: subscription.stripeSubscriptionId,
			status: subscription.status,
			priceId: subscription.priceId,
			currentPeriodEnd: subscription.currentPeriodEnd,
			cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
		}))
	},
})

export const createSubscriptionCheckout = action({
	args: {},
	handler: async (ctx) => {
		const identity = await requireIdentity(ctx)
		const siteUrl = requireEnvironment('SITE_URL')
		const customer = await stripe.getOrCreateCustomer(ctx, {
			userId: identity.subject,
			email: identity.email,
			name: identity.name,
		})

		return stripe.createCheckoutSession(ctx, {
			customerId: customer.customerId,
			priceId: requireEnvironment('STRIPE_PRICE_ID'),
			mode: 'subscription',
			successUrl: `${siteUrl}/?checkout=success`,
			cancelUrl: `${siteUrl}/?checkout=cancelled`,
			metadata: {
				userId: identity.subject,
			},
			subscriptionMetadata: {
				userId: identity.subject,
			},
		})
	},
})

export const createCustomerPortal = action({
	args: {},
	handler: async (ctx) => {
		const identity = await requireIdentity(ctx)
		const customer = await stripe.getOrCreateCustomer(ctx, {
			userId: identity.subject,
			email: identity.email,
			name: identity.name,
		})

		return stripe.createCustomerPortalSession(ctx, {
			customerId: customer.customerId,
			returnUrl: requireEnvironment('SITE_URL'),
		})
	},
})
