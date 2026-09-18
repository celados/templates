import * as stylex from '@stylexjs/stylex'
import {
	action,
	createOptimistic,
	createSignal,
	For,
	Loading,
	Show,
	useContext,
} from 'solid-js'

import { api } from '../../../convex/_generated/api'
import { AuthContext } from '../lib/auth'
import { createConvexQuery, useConvexClient } from '../lib/convex'
import { ui } from '../styles/ui'

export function BillingDemo() {
	const auth = useContext(AuthContext)
	return (
		<article {...stylex.attrs(ui.card)}>
			<p {...stylex.attrs(ui.eyebrow)}>Stripe</p>
			<h2 {...stylex.attrs(ui.heading)}>Subscription billing</h2>
			<Show
				when={auth.user$()}
				fallback={
					<p {...stylex.attrs(ui.muted)}>
						Sign in before creating a checkout or portal session.
					</p>
				}
			>
				<Billing />
			</Show>
		</article>
	)
}

function Billing() {
	const client = useConvexClient()
	const subscriptions$ = createConvexQuery(
		api.billing.currentSubscription,
		() => ({}),
	)
	const [redirecting, setRedirecting] = createOptimistic(false)
	const [error, setError] = createSignal<string>()

	// Both sessions end in a full-page navigation to Stripe, so the flag only
	// needs to cover the round trip that mints the URL.
	const open = action(function* (kind: 'checkout' | 'portal') {
		setRedirecting(true)
		const session: { url: string | null } = yield kind === 'checkout'
			? client.action(api.billing.createSubscriptionCheckout, {})
			: client.action(api.billing.createCustomerPortal, {})
		if (!session.url) throw new Error('Stripe did not return a session URL')
		window.location.assign(session.url)
	})
	const start = (kind: 'checkout' | 'portal') => {
		setError(undefined)
		open(kind).catch((cause: Error) => setError(cause.message))
	}

	return (
		<>
			<Loading fallback={<p {...stylex.attrs(ui.muted)}>Loading billing…</p>}>
				<ul {...stylex.attrs(ui.list)}>
					<For
						each={subscriptions$()}
						keyed={(subscription) => subscription.id}
						fallback={
							<li {...stylex.attrs(ui.muted)}>
								No subscription is linked to this user.
							</li>
						}
					>
						{(subscription) => (
							<li {...stylex.attrs(ui.todo)}>
								<p>{subscription().status}</p>
								<p {...stylex.attrs(ui.muted)}>{subscription().priceId}</p>
							</li>
						)}
					</For>
				</ul>
			</Loading>
			<div {...stylex.attrs(ui.row)}>
				<button
					type="button"
					{...stylex.attrs(ui.button)}
					disabled={redirecting()}
					onClick={() => start('checkout')}
				>
					Start checkout
				</button>
				<button
					type="button"
					{...stylex.attrs(ui.button, ui.outline)}
					disabled={redirecting()}
					onClick={() => start('portal')}
				>
					Billing portal
				</button>
			</div>
			<Show when={error()}>
				{(message) => (
					<p role="alert" {...stylex.attrs(ui.error)}>
						{message()}
					</p>
				)}
			</Show>
		</>
	)
}
