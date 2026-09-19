import { render } from '@solidjs/web'

import { i18n } from '#i18n'
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
								title={i18n.t('content.title')}
								description={i18n.t('content.description')}
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
