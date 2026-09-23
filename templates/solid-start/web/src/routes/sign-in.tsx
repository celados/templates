import { Title } from '@solidjs/meta'
import { useLocation } from '@solidjs/router'
import * as stylex from '@stylexjs/stylex'
import {
	action,
	createMemo,
	createOptimistic,
	createSignal,
	Show,
} from 'solid-js'

import { sendMagicLink, signInWithGoogle } from '../lib/auth'
import { errorMessage } from '../lib/error-message'
import { ui } from '../styles/ui'

export default function SignIn() {
	const location = useLocation()
	const next = createMemo(() => {
		const value = new URLSearchParams(location.search).get('next') ?? '/'
		// Only same-origin paths; an absolute URL here would be an open redirect.
		return value.startsWith('/') && !value.startsWith('//') ? value : '/'
	})
	const [busy, setBusy] = createOptimistic(false)
	const [sentTo, setSentTo] = createSignal<string>()
	const [error, setError] = createSignal<string>()

	// Google resolves only as the browser leaves for the provider, so the busy
	// flag intentionally stays on until the navigation replaces this page.
	const google = action(function* () {
		setBusy(true)
		try {
			yield signInWithGoogle(next())
		} catch (cause) {
			setError(errorMessage(cause))
		}
	})
	const magicLink = action(function* (email: string) {
		setBusy(true)
		try {
			yield sendMagicLink(email, next())
			setError(undefined)
			setSentTo(email)
		} catch (cause) {
			setError(errorMessage(cause))
		}
	})

	return (
		<main {...stylex.attrs(ui.centered)}>
			<Title>Sign in</Title>
			<section {...stylex.attrs(ui.card, ui.narrow)}>
				<h1 {...stylex.attrs(ui.heading)}>Sign in to your account</h1>
				<p {...stylex.attrs(ui.muted)}>
					Use Google or receive a secure sign-in link by email.
				</p>
				<button
					type="button"
					{...stylex.attrs(ui.button, ui.outline)}
					disabled={busy()}
					onClick={() => void google()}
				>
					<img src="/google.svg" alt="" width="16" height="16" />
					Continue with Google
				</button>
				<Show
					when={sentTo()}
					fallback={
						<form
							{...stylex.attrs(ui.list)}
							onSubmit={(event) => {
								event.preventDefault()
								const email = new FormData(event.currentTarget).get('email')
								if (typeof email === 'string' && email) void magicLink(email)
							}}
						>
							<input
								{...stylex.attrs(ui.input)}
								aria-label="Email"
								autocomplete="email"
								name="email"
								placeholder="you@example.com"
								required
								type="email"
							/>
							<button
								type="submit"
								{...stylex.attrs(ui.button)}
								disabled={busy()}
							>
								Email me a sign-in link
							</button>
						</form>
					}
				>
					{(email) => (
						<p role="status" {...stylex.attrs(ui.muted)}>
							We sent a sign-in link to {email()}. It expires in 5 minutes and
							can only be used once.
						</p>
					)}
				</Show>
				<Show when={error()}>
					{(message) => (
						<p role="alert" {...stylex.attrs(ui.error)}>
							{message()}
						</p>
					)}
				</Show>
			</section>
		</main>
	)
}
