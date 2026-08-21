import { Link, createFileRoute } from '@tanstack/react-router'

import { ResponsiveImage } from '@/components/responsive-image'
import { seoHead } from '@/lib/seo'

export const Route = createFileRoute('/')({
	head: () =>
		seoHead({
			title: 'Calque Site',
			description: 'A Calque-ready, SSG-first TanStack Start site.',
			path: '/',
		}),
	component: HomePage,
})

function HomePage() {
	return (
		<main className="grid min-h-svh place-items-center bg-background px-6 py-12 text-foreground">
			<section className="w-full max-w-2xl space-y-6 rounded-3xl border bg-card p-8 shadow-sm">
				<p className="text-sm font-medium text-muted-foreground">
					Calque · TanStack Start · Cloudflare Workers
				</p>
				<h1 className="text-4xl font-semibold tracking-tight">
					Ready for a faithful site clone
				</h1>
				<p className="max-w-xl leading-7 text-muted-foreground">
					Replace this route with project-owned sections assembled from the
					Calque projection. Keep captured files under the Calque namespace
					read-only.
				</p>
				<ResponsiveImage
					alt="Abstract illustration of a statically generated content page"
					className="h-auto w-full rounded-2xl"
				/>
				<Link
					className="inline-flex rounded-full bg-primary px-5 py-2.5 text-primary-foreground"
					to="/posts"
				>
					Explore the SSG content example
				</Link>
			</section>
		</main>
	)
}
