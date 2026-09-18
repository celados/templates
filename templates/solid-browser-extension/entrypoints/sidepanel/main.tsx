import { render } from '@solidjs/web'

import { CounterPanel } from '../../src/ui/counter-panel'

import './style.css'

const target = document.querySelector<HTMLElement>('#app')

if (!target) {
	throw new Error('Side panel mount target was not found')
}

const dispose = render(
	() => (
		<main>
			<CounterPanel
				title="Solid Extension"
				description="The side panel and page widget share typed messages and versioned local storage."
			/>
			<p class="hint">
				Open{' '}
				<a href="https://example.com" target="_blank">
					example.com
				</a>{' '}
				to exercise the isolated content-script UI.
			</p>
		</main>
	),
	target,
)

if (import.meta.hot) {
	import.meta.hot.dispose(dispose)
}
