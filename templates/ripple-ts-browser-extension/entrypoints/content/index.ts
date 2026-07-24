import { mount } from 'ripple'

import { createShadowRootUi, defineContentScript } from '#imports'

import { ContentWidget } from './widget.tsrx'

import './style.css'

export default defineContentScript({
	matches: ['https://example.com/*'],
	cssInjectionMode: 'ui',
	async main(context) {
		const ui = await createShadowRootUi(context, {
			name: 'ripple-extension-ui',
			position: 'inline',
			anchor: 'body',
			isolateEvents: true,
			onMount(container) {
				return mount(ContentWidget, { target: container })
			},
			onRemove(dispose) {
				dispose?.()
			},
		})

		ui.mount()
	},
})
