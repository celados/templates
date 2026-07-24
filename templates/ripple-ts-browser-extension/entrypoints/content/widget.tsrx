import { CounterPanel } from '@app/ui'
import { effect, track } from 'ripple'

import {
	sendCounterCommand,
	watchCounter,
} from '../../src/extension/client'

export function ContentWidget() @{
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

	<div class="ripple-extension-widget">
		<CounterPanel
			title="Ripple on this page"
			description="Shadow DOM isolates this UI while the background worker owns state."
			{count}
			disabled={pending}
			onIncrement={() => void run('counter:increment')}
			onReset={() => void run('counter:reset')}
		/>
	</div>
}
