import { render } from '@solidjs/web'
import * as stylex from '@stylexjs/stylex'
import { Errored } from 'solid-js'

import { i18n } from '#i18n'

import { colors, space } from '../../../web/src/styles/tokens.stylex'
import { reportError } from '../../src/extension/client'
import { AccountPanel } from '../../src/ui/account-panel'
import { CounterPanel } from '../../src/ui/counter-panel'
import { ui } from '../../src/ui/ui'

import '../../../web/src/styles/reset.css'

// Extension pages own their global, so page-wide handlers only see our errors.
window.addEventListener('error', (event) => reportError(event.error))
window.addEventListener('unhandledrejection', (event) =>
	reportError(event.reason),
)

const target = document.querySelector<HTMLElement>('#app')

if (!target) {
	throw new Error('Side panel mount target was not found')
}

const dispose = render(
	() => (
		<main {...stylex.attrs(styles.main)}>
			<CounterPanel
				title={i18n.t('sidepanel.title')}
				description={i18n.t('sidepanel.description')}
			/>
			<Errored
				fallback={(error) => (
					<p {...stylex.attrs(ui.muted)} data-testid="account-error">
						{String(error())}
					</p>
				)}
			>
				<AccountPanel />
			</Errored>
			<p {...stylex.attrs(ui.muted)}>
				<a
					{...stylex.attrs(styles.link)}
					href="https://example.com"
					target="_blank"
				>
					{i18n.t('sidepanel.hint')}
				</a>
			</p>
		</main>
	),
	target,
	undefined,
	// Boundary-caught errors reach only this root hook, never window.onerror.
	{ onError: reportError },
)

if (import.meta.hot) {
	import.meta.hot.dispose(dispose)
}

const styles = stylex.create({
	main: {
		display: 'grid',
		alignContent: 'start',
		gap: space.md,
		minWidth: '280px',
		minHeight: '100vh',
		padding: space.md,
		backgroundColor: colors.canvas,
	},
	link: { color: colors.accent, textUnderlineOffset: '2px' },
})
