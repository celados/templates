import * as stylex from '@stylexjs/stylex'
import {
	action,
	createOptimistic,
	createSignal,
	Show,
	useContext,
} from 'solid-js'

import { AuthContext } from '../lib/auth'
import { errorMessage } from '../lib/error-message'
import { paths } from '../router'
import { ui } from '../styles/ui'

export function AuthStatus() {
	const auth = useContext(AuthContext)
	const [signingOut, setSigningOut] = createOptimistic(false)
	const [error, setError] = createSignal<string>()
	// The action records its own failure, so callers only start it.
	const signOut = action(function* () {
		setSigningOut(true)
		try {
			yield auth.signOut()
			setError(undefined)
		} catch (cause) {
			setError(errorMessage(cause))
		}
	})

	return (
		<article {...stylex.attrs(ui.card)}>
			<p {...stylex.attrs(ui.eyebrow)}>Better Auth</p>
			<Show
				when={auth.user$()}
				fallback={
					<>
						<h2 {...stylex.attrs(ui.heading)}>Passwordless sign-in</h2>
						<p {...stylex.attrs(ui.muted)}>
							Google OAuth and short-lived magic links are ready to configure.
						</p>
						<a href={paths['sign-in']} {...stylex.attrs(ui.button)}>
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
							onClick={() => void signOut()}
						>
							{signingOut() ? 'Signing out…' : 'Sign out'}
						</button>
					</>
				)}
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
