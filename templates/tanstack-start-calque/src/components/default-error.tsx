import type { ErrorComponentProps } from '@tanstack/react-router'

import { useRouter } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'

export function DefaultError(props: ErrorComponentProps) {
	const { error } = props
	const router = useRouter()

	return (
		<main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-start justify-center gap-4 px-6 py-16">
			<p className="text-sm font-medium text-destructive">
				Something went wrong
			</p>
			<h1 className="text-3xl font-semibold tracking-tight">
				We couldn't load this page.
			</h1>
			<p className="text-muted-foreground">
				{import.meta.env.DEV
					? getErrorMessage(error)
					: 'Try again. If the problem continues, contact support.'}
			</p>
			<Button onClick={() => void router.invalidate()}>Try again</Button>
		</main>
	)
}

function getErrorMessage(error: unknown) {
	return error instanceof Error ? error.message : 'Unknown error'
}
