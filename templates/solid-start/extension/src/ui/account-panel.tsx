import * as stylex from '@stylexjs/stylex'
import { Errored, For, Loading, onCleanup, Show } from 'solid-js'

import { i18n } from '#i18n'

import { api } from '../../../convex/_generated/api'
import {
	BackendContext,
	createBackend,
	createPersistedQuery,
	createSession,
	useBackend,
} from '../backend/convex'
import { openSignIn } from '../backend/session'
import { ui } from './ui'

/**
 * Product data from the shared Convex backend. With snapshots stored, the first
 * frame renders them and no Loading fallback appears; live answers replace them
 * in place.
 */
export function AccountPanel() {
	// Both sources live here, above the boundaries that read them.
	const backend = createBackend()
	const user$ = createSession(backend)
	// Tied to this owner, not to a settle: the client must close even if the
	// first load never settles.
	onCleanup(backend.dispose)
	return (
		<BackendContext value={backend}>
			<section {...stylex.attrs(ui.panel)} data-testid="account-panel">
				<p {...stylex.attrs(ui.eyebrow)}>{i18n.t('account.eyebrow')}</p>
				<Loading fallback={<p data-testid="account-loading">…</p>}>
					<Show
						when={user$()}
						fallback={
							<button
								type="button"
								{...stylex.attrs(ui.button)}
								data-testid="sign-in"
								onClick={() => openSignIn()}
							>
								{i18n.t('account.signIn')}
							</button>
						}
					>
						{(user) => (
							<>
								<p {...stylex.attrs(ui.muted)} data-testid="account-user">
									{user().email}
								</p>
								{/* Inside Show: when a sign-out also fails the todos query,
								    the sign-in fallback replaces this boundary whichever
								    answer lands first. */}
								<Errored
									fallback={(_, reset) => (
										<p {...stylex.attrs(ui.muted)} data-testid="todos-error">
											{i18n.t('account.loadFailed')}{' '}
											<button
												type="button"
												{...stylex.attrs(ui.button, ui.outline)}
												onClick={reset}
											>
												{i18n.t('account.retry')}
											</button>
										</p>
									)}
								>
									<Todos />
								</Errored>
							</>
						)}
					</Show>
				</Loading>
			</section>
		</BackendContext>
	)
}

// Mounted only for a known user, so the subscription starts authenticated.
function Todos() {
	const todos$ = createPersistedQuery(useBackend(), api.todos.list, () => ({}))
	return (
		<Loading fallback={<p data-testid="todos-loading">…</p>}>
			<ul {...stylex.attrs(ui.stack)} data-testid="todos">
				<For
					each={todos$()}
					fallback={
						<li {...stylex.attrs(ui.muted)}>{i18n.t('account.empty')}</li>
					}
				>
					{(todo) => (
						<li {...stylex.attrs(todo.completed && ui.done)}>{todo.text}</li>
					)}
				</For>
			</ul>
		</Loading>
	)
}
