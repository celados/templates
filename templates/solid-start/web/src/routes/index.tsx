import * as stylex from '@stylexjs/stylex'

import { AuthStatus } from '../components/auth-status'
import { BillingDemo } from '../components/billing-demo'
import { TodoDemo } from '../components/todo-demo'
import { ui } from '../styles/ui'

export default function Home() {
	return (
		<main {...stylex.attrs(ui.main)}>
			<header {...stylex.attrs(ui.list)}>
				<p {...stylex.attrs(ui.muted)}>
					Solid 2 · Convex · Better Auth · Stripe · Cloudflare Workers
				</p>
				<h1 {...stylex.attrs(ui.title)}>
					A complete full-stack starting point
				</h1>
				<p {...stylex.attrs(ui.muted)}>
					Server rendering, live data, authentication, and billing share one
					application root and one dependency graph.
				</p>
			</header>
			<section {...stylex.attrs(ui.grid)}>
				<AuthStatus />
				<TodoDemo />
				<BillingDemo />
			</section>
		</main>
	)
}
