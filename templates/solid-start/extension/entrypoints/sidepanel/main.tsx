import { render } from '@solidjs/web'
import { Errored } from 'solid-js'

import { i18n } from '#i18n'

import { reportError } from '../../src/extension/client'
import { AccountPanel } from '../../src/ui/account-panel'
import { CounterPanel } from '../../src/ui/counter-panel'

import './style.css'

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
		<main>
			<CounterPanel
				title={i18n.t('sidepanel.title')}
				description={i18n.t('sidepanel.description')}
			/>
			<Errored
				fallback={(error) => (
					<p class="hint" data-testid="account-error">
						{String(error())}
					</p>
				)}
			>
				<AccountPanel />
			</Errored>
			<p class="hint">
				<a href="https://example.com" target="_blank">
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
