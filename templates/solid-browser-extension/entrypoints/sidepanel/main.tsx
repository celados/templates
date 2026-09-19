import { render } from '@solidjs/web'

import { i18n } from '#i18n'

import { reportError } from '../../src/extension/client'
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
			<p class="hint">
				<a href="https://example.com" target="_blank">
					{i18n.t('sidepanel.hint')}
				</a>
			</p>
		</main>
	),
	target,
)

if (import.meta.hot) {
	import.meta.hot.dispose(dispose)
}
