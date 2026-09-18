import { render } from '@solidjs/web'

import { createShadowRootUi, defineContentScript } from '#imports'

import { CounterPanel } from '../../src/ui/counter-panel'

import './style.css'

export default defineContentScript({
	matches: ['https://example.com/*'],
	cssInjectionMode: 'ui',
	async main(context) {
		const ui = await createShadowRootUi(context, {
			name: 'solid-extension-ui',
			position: 'inline',
			anchor: 'body',
			isolateEvents: true,
			onMount(container) {
				return render(
					() => (
						<div class="extension-widget">
							<CounterPanel
								title="Solid on this page"
								description="Shadow DOM isolates this UI while the background worker owns state."
							/>
						</div>
					),
					container,
				)
			},
			onRemove(dispose) {
				dispose?.()
			},
		})

		ui.mount()
	},
})
