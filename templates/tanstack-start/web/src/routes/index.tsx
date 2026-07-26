import { createFileRoute } from '@tanstack/react-router'

import { AuthStatus } from '@/components/auth-status'
import { BillingDemo } from '@/components/billing-demo'
import { TodoDemo } from '@/components/todo-demo'

export const Route = createFileRoute('/')({ component: App })

function App() {
	return (
		<main className="mx-auto flex min-h-svh max-w-6xl flex-col gap-8 p-6 py-12">
			<header className="max-w-3xl space-y-3">
				<p className="text-sm font-medium text-muted-foreground">
					TanStack Start · Convex · Better Auth · Stripe
				</p>
				<h1 className="text-4xl font-semibold tracking-tight">
					A complete full-stack starting point
				</h1>
				<p className="text-muted-foreground">
					Authentication, reactive data, billing, Cloudflare deployment, and
					typed code generation share one application root and one dependency
					graph.
				</p>
			</header>

			<section className="grid gap-5 lg:grid-cols-3">
				<AuthStatus />
				<TodoDemo />
				<BillingDemo />
			</section>
		</main>
	)
}
