import { useMutation } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { Mail } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { authClient } from '@/lib/auth-client'

type SignInCardProps = {
	redirectTo: string
}

export function SignInCard(props: SignInCardProps) {
	const session = authClient.useSession()
	const [sentTo, setSentTo] = useState<string>()

	const googleSignIn = useMutation({
		mutationFn: async () => {
			const result = await authClient.signIn.social({
				provider: 'google',
				callbackURL: props.redirectTo,
			})
			if (result.error) {
				throw new Error(result.error.message)
			}
		},
	})

	const magicLinkSignIn = useMutation({
		mutationFn: async (email: string) => {
			const result = await authClient.signIn.magicLink({
				email,
				callbackURL: props.redirectTo,
			})
			if (result.error) {
				throw new Error(result.error.message)
			}
			return email
		},
		onSuccess: (email) => {
			setSentTo(email)
		},
	})

	if (session.data?.user) {
		return (
			<AuthCard>
				<h1 className="text-2xl font-semibold tracking-tight">
					You are already signed in
				</h1>
				<p className="mt-2 text-sm text-muted-foreground">
					Continue as {session.data.user.email}.
				</p>
				<Link
					className="mt-6 inline-flex text-sm font-medium text-primary hover:underline"
					to={props.redirectTo}
				>
					Continue
				</Link>
			</AuthCard>
		)
	}

	return (
		<AuthCard>
			<div className="text-center">
				<p className="text-sm font-medium text-muted-foreground">
					Welcome back
				</p>
				<h1 className="mt-2 text-2xl font-semibold tracking-tight">
					Sign in to your account
				</h1>
				<p className="mt-2 text-sm text-muted-foreground">
					Use Google or receive a secure sign-in link by email.
				</p>
			</div>

			<Button
				className="mt-7 h-10 w-full"
				variant="outline"
				disabled={googleSignIn.isPending}
				onClick={() => googleSignIn.mutate()}
			>
				<img alt="" className="size-4 dark:invert" src="/icons/si-google.svg" />
				{googleSignIn.isPending ? 'Opening Google…' : 'Continue with Google'}
			</Button>

			<div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
				<span className="h-px flex-1 bg-border" />
				<span>OR</span>
				<span className="h-px flex-1 bg-border" />
			</div>

			{sentTo ? (
				<div className="rounded-xl border bg-muted/50 p-4 text-center">
					<Mail className="mx-auto size-5" />
					<p className="mt-2 text-sm font-medium">Check your inbox</p>
					<p className="mt-1 text-sm text-muted-foreground">
						We sent a sign-in link to {sentTo}.
					</p>
					<Button
						className="mt-3"
						variant="ghost"
						onClick={() => setSentTo(undefined)}
					>
						Use another email
					</Button>
				</div>
			) : (
				<form
					className="space-y-3"
					onSubmit={(event) => {
						event.preventDefault()
						const data = new FormData(event.currentTarget)
						magicLinkSignIn.mutate(getFormString(data, 'email'))
					}}
				>
					<label className="grid gap-1.5 text-sm">
						<span>Email</span>
						<input
							className="h-10 rounded-lg border bg-background px-3 outline-none focus:ring-2 focus:ring-ring"
							autoComplete="email"
							name="email"
							placeholder="you@example.com"
							required
							type="email"
						/>
					</label>
					<Button className="h-10 w-full" disabled={magicLinkSignIn.isPending}>
						<Mail />
						{magicLinkSignIn.isPending
							? 'Sending link…'
							: 'Email me a sign-in link'}
					</Button>
				</form>
			)}

			<MutationError error={googleSignIn.error ?? magicLinkSignIn.error} />
			<p className="mt-6 text-center text-xs leading-5 text-muted-foreground">
				Magic links expire after 5 minutes and can only be used once.
			</p>
		</AuthCard>
	)
}

function AuthCard(props: { children: React.ReactNode }) {
	return (
		<section className="w-full max-w-md rounded-3xl border bg-card p-7 text-card-foreground shadow-lg">
			{props.children}
		</section>
	)
}

function MutationError(props: { error: Error | null }) {
	if (!props.error) {
		return null
	}

	return (
		<p className="mt-4 text-center text-sm text-destructive" role="alert">
			{props.error.message}
		</p>
	)
}

function getFormString(data: FormData, name: string) {
	const value = data.get(name)
	if (typeof value !== 'string' || !value) {
		throw new Error(`${name} is required`)
	}
	return value
}
