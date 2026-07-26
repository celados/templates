import { useMutation } from '@tanstack/react-query'
import { Link, useRouter } from '@tanstack/react-router'

import { Button, buttonVariants } from '@/components/ui/button'
import { authClient } from '@/lib/auth-client'
import { cn } from '@/lib/utils'

export function AuthStatus() {
	const router = useRouter()
	const session = authClient.useSession()
	const signOut = useMutation({
		mutationFn: async () => {
			const result = await authClient.signOut()
			if (result.error) {
				throw new Error(result.error.message)
			}
		},
		onSuccess: async () => {
			await router.invalidate()
		},
	})

	if (!session.data?.user) {
		return (
			<article className="rounded-2xl border bg-card p-5 text-card-foreground shadow-sm">
				<p className="text-xs font-medium text-muted-foreground">Better Auth</p>
				<h2 className="mt-2 text-xl font-semibold">Passwordless sign-in</h2>
				<p className="mt-3 text-sm text-muted-foreground">
					Google OAuth and short-lived magic links are ready to configure.
				</p>
				<Link
					className={cn(buttonVariants(), 'mt-5 w-full')}
					to="/auth/sign-in"
				>
					Sign in
				</Link>
			</article>
		)
	}

	return (
		<article className="rounded-2xl border bg-card p-5 text-card-foreground shadow-sm">
			<p className="text-xs font-medium text-muted-foreground">Better Auth</p>
			<h2 className="mt-2 text-xl font-semibold">Signed in</h2>
			<p className="mt-3 text-sm">{session.data.user.name}</p>
			<p className="text-sm text-muted-foreground">{session.data.user.email}</p>
			<Button
				className="mt-5"
				variant="outline"
				disabled={signOut.isPending}
				onClick={() => signOut.mutate()}
			>
				{signOut.isPending ? 'Signing out…' : 'Sign out'}
			</Button>
			<MutationError error={signOut.error} />
		</article>
	)
}

function MutationError(props: { error: Error | null }) {
	if (!props.error) {
		return null
	}

	return (
		<p className="mt-3 text-sm text-destructive" role="alert">
			{props.error.message}
		</p>
	)
}
