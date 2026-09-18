import * as stylex from '@stylexjs/stylex'
import {
	action,
	createOptimistic,
	createSignal,
	Show,
	useContext,
} from 'solid-js'

import { AuthContext } from '../lib/auth'
import { ui } from '../styles/ui'

export function AuthStatus() {
	const auth = useContext(AuthContext)
	const [signingOut, setSigningOut] = createOptimistic(false)
	const [error, setError] = createSignal<string>()
	const signOut = action(function* () {
		setSigningOut(true)
		yield auth.signOut()
	})

	return (
		<article {...stylex.attrs(ui.card)}>
			<p {...stylex.attrs(ui.eyebrow)}>Better Auth</p>
			{/* user$ declares a quiet first paint: undefined means "not known yet". */}
			<Show
				when={auth.user$() !== undefined}
				fallback={<p {...stylex.attrs(ui.muted)}>Checking the session…</p>}
			>
				<Show
					when={auth.user$()}
					fallback={
						<>
							<h2 {...stylex.attrs(ui.heading)}>Passwordless sign-in</h2>
							<p {...stylex.attrs(ui.muted)}>
								Google OAuth and short-lived magic links are ready to configure.
							</p>
							<a href="/sign-in" {...stylex.attrs(ui.button)}>
								Sign in
							</a>
						</>
					}
				>
					{(user) => (
						<>
							<h2 {...stylex.attrs(ui.heading)}>Signed in</h2>
							<p>{user().name}</p>
							<p {...stylex.attrs(ui.muted)}>{user().email}</p>
							<button
								type="button"
								{...stylex.attrs(ui.button, ui.outline)}
								disabled={signingOut()}
								onClick={() => {
									setError(undefined)
									signOut().catch((cause: Error) => setError(cause.message))
								}}
							>
								{signingOut() ? 'Signing out…' : 'Sign out'}
							</button>
						</>
					)}
				</Show>
			</Show>
			<Show when={error()}>
				{(message) => (
					<p role="alert" {...stylex.attrs(ui.error)}>
						{message()}
					</p>
				)}
			</Show>
		</article>
	)
}
