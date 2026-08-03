import { AuthStatus } from '@/components/auth-status'
import { BillingDemo } from '@/components/billing-demo'
import { TodoDemo } from '@/components/todo-demo'
import type { SiteConfig } from '@/site/site-config'

export function HomePage(props: { site: SiteConfig }) {
	const { site } = props
	return (
		<main className="mx-auto flex min-h-svh max-w-6xl flex-col gap-8 p-6 py-12">
			<header className="max-w-3xl space-y-3">
				<p className="text-sm font-medium text-muted-foreground">
					{site.name} · TanStack Start · Convex · Better Auth · Stripe
				</p>
				<h1 className="text-4xl font-semibold tracking-tight">
					{site.tagline}
				</h1>
				<p className="text-muted-foreground">{site.description}</p>
			</header>

			<section className="grid gap-5 lg:grid-cols-3">
				<AuthStatus />
				<TodoDemo />
				<BillingDemo siteId={site.id} />
			</section>
		</main>
	)
}
