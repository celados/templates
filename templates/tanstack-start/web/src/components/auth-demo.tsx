import { useMutation } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { authClient } from '@/lib/auth-client'

type AuthMode = 'sign-in' | 'sign-up'

type AuthInput = {
	email: string
	name: string
	password: string
}

export function AuthDemo() {
	const router = useRouter()
	const session = authClient.useSession()
	const [mode, setMode] = useState<AuthMode>('sign-in')

	const authenticate = useMutation({
		mutationFn: async (input: AuthInput) => {
			const result =
				mode === 'sign-up'
					? await authClient.signUp.email(input)
					: await authClient.signIn.email({
							email: input.email,
							password: input.password,
						})

			if (result.error) {
				throw new Error(result.error.message)
			}
		},
		onSuccess: async () => {
			await router.invalidate()
		},
	})

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

	if (session.data?.user) {
		return (
			<article className="rounded-2xl border bg-card p-5 text-card-foreground shadow-sm">
				<p className="text-xs font-medium text-muted-foreground">Better Auth</p>
				<h2 className="mt-2 text-xl font-semibold">Signed in</h2>
				<p className="mt-3 text-sm">{session.data.user.name}</p>
				<p className="text-sm text-muted-foreground">
					{session.data.user.email}
				</p>
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

	return (
		<article className="rounded-2xl border bg-card p-5 text-card-foreground shadow-sm">
			<p className="text-xs font-medium text-muted-foreground">Better Auth</p>
			<h2 className="mt-2 text-xl font-semibold">
				{mode === 'sign-in' ? 'Sign in' : 'Create an account'}
			</h2>
			<form
				className="mt-5 space-y-3"
				onSubmit={(event) => {
					event.preventDefault()
					const data = new FormData(event.currentTarget)
					authenticate.mutate({
						email: getFormString(data, 'email'),
						name: mode === 'sign-up' ? getFormString(data, 'name') : '',
						password: getFormString(data, 'password'),
					})
				}}
			>
				{mode === 'sign-up' ? (
					<TextInput name="name" label="Name" autoComplete="name" />
				) : null}
				<TextInput
					name="email"
					label="Email"
					type="email"
					autoComplete="email"
				/>
				<TextInput
					name="password"
					label="Password"
					type="password"
					autoComplete={
						mode === 'sign-in' ? 'current-password' : 'new-password'
					}
				/>
				<Button className="w-full" disabled={authenticate.isPending}>
					{authenticate.isPending
						? 'Working…'
						: mode === 'sign-in'
							? 'Sign in'
							: 'Sign up'}
				</Button>
			</form>
			<Button
				className="mt-2 w-full"
				variant="ghost"
				onClick={() =>
					setMode((current) => (current === 'sign-in' ? 'sign-up' : 'sign-in'))
				}
			>
				{mode === 'sign-in' ? 'Need an account?' : 'Already have an account?'}
			</Button>
			<MutationError error={authenticate.error} />
		</article>
	)
}

function getFormString(data: FormData, name: string) {
	const value = data.get(name)
	if (typeof value !== 'string') {
		throw new Error(`${name} is required`)
	}
	return value
}

type TextInputProps = {
	autoComplete: string
	label: string
	name: string
	type?: string
}

function TextInput(props: TextInputProps) {
	return (
		<label className="grid gap-1.5 text-sm">
			<span>{props.label}</span>
			<input
				className="h-9 rounded-lg border bg-background px-3 outline-none focus:ring-2 focus:ring-ring"
				autoComplete={props.autoComplete}
				name={props.name}
				required
				type={props.type}
			/>
		</label>
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
