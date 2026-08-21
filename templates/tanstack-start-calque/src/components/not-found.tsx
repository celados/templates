import { Link } from '@tanstack/react-router'

import { buttonVariants } from '@/components/ui/button'

export function NotFound() {
	return (
		<main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-start justify-center gap-4 px-6 py-16">
			<p className="text-sm font-medium text-muted-foreground">404</p>
			<h1 className="text-3xl font-semibold tracking-tight">Page not found</h1>
			<p className="text-muted-foreground">
				The page may have moved, or the address may be incorrect.
			</p>
			<Link to="/" className={buttonVariants()}>
				Go home
			</Link>
		</main>
	)
}
