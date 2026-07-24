import { CounterPanel } from '@app/ui'
import { effect, track } from 'ripple'

import {
	sendCounterCommand,
	watchCounter,
} from '../../src/extension/client'

export function SidePanelApp() @{
	let &[count] = track(0)
	let &[pending] = track(true)

	async function run(type: 'counter:get' | 'counter:increment' | 'counter:reset') {
		pending = true

		try {
			const state = await sendCounterCommand({ type })
			count = state.count
		} finally {
			pending = false
		}
	}

	effect(() => {
		const unwatch = watchCounter((nextCount) => {
			count = nextCount
		})
		void run('counter:get')
		return unwatch
	})

	<main>
		<CounterPanel
			title="Ripple Extension"
			description="The side panel and page widget share typed messages and versioned local storage."
			{count}
			disabled={pending}
			onIncrement={() => void run('counter:increment')}
			onReset={() => void run('counter:reset')}
		/>
		<p class="hint">
			Open <a href="https://example.com" target="_blank">example.com</a> to exercise
			the isolated content-script UI.
		</p>
	</main>
}
