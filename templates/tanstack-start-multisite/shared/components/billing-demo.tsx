import { convexQuery } from '@convex-dev/react-query'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useConvex, useConvexAuth } from 'convex/react'

import { Button } from '@/components/ui/button'
import type { SiteId } from '@/site/site-config'
import { api } from '~/convex/_generated/api'

export function BillingDemo(props: { siteId: SiteId }) {
	const { siteId } = props
	const convex = useConvex()
	const auth = useConvexAuth()
	const subscriptions = useQuery(
		convexQuery(
			api.billing.currentSubscription,
			auth.isAuthenticated ? {} : 'skip',
		),
	)
	const checkout = useMutation({
		mutationFn: () =>
			convex.action(api.billing.createSubscriptionCheckout, { siteId }),
		onSuccess: (session) => {
			if (!session.url) {
				throw new Error('Stripe did not return a checkout URL')
			}
			window.location.assign(session.url)
		},
	})
	const portal = useMutation({
		mutationFn: () =>
			convex.action(api.billing.createCustomerPortal, { siteId }),
		onSuccess: (session) => window.location.assign(session.url),
	})

	const error = checkout.error ?? portal.error

	return (
		<article className="rounded-2xl border bg-card p-5 text-card-foreground shadow-sm">
			<p className="text-xs font-medium text-muted-foreground">Stripe</p>
			<h2 className="mt-2 text-xl font-semibold">Subscription billing</h2>
			{!auth.isAuthenticated ? (
				<p className="mt-4 text-sm text-muted-foreground">
					Sign in before creating a checkout or portal session.
				</p>
			) : (
				<>
					<div className="mt-4 space-y-2 text-sm">
						{subscriptions.data?.map((subscription) => (
							<div className="rounded-lg border p-3" key={subscription.id}>
								<p className="font-medium">{subscription.status}</p>
								<p className="truncate text-muted-foreground">
									{subscription.priceId}
								</p>
							</div>
						))}
						{subscriptions.data?.length === 0 ? (
							<p className="text-muted-foreground">
								No subscription is linked to this user.
							</p>
						) : null}
					</div>
					<div className="mt-5 flex flex-wrap gap-2">
						<Button
							disabled={checkout.isPending}
							onClick={() => checkout.mutate()}
						>
							{checkout.isPending ? 'Opening…' : 'Start checkout'}
						</Button>
						<Button
							variant="outline"
							disabled={portal.isPending}
							onClick={() => portal.mutate()}
						>
							Billing portal
						</Button>
					</div>
					{error ? (
						<p className="mt-3 text-sm text-destructive" role="alert">
							{error.message}
						</p>
					) : null}
				</>
			)}
		</article>
	)
}
