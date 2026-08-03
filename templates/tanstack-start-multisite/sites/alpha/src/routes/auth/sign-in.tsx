import { createFileRoute } from '@tanstack/react-router'
import * as v from 'valibot'

import { SignInCard } from '@/components/sign-in-card'

const searchSchema = v.looseObject({
	redirectTo: v.optional(v.string()),
})

export const Route = createFileRoute('/auth/sign-in')({
	component: SignInPage,
	validateSearch: (search) => v.parse(searchSchema, search),
})

function SignInPage() {
	const search = Route.useSearch()
	const redirectTo = getSafeRedirect(search.redirectTo)

	return (
		<main className="grid min-h-svh place-items-center bg-muted/30 p-6">
			<SignInCard redirectTo={redirectTo} />
		</main>
	)
}

function getSafeRedirect(value: string | undefined) {
	if (!value?.startsWith('/') || value.startsWith('//')) {
		return '/'
	}
	return value
}
