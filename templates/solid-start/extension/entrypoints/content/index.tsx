import { render } from '@solidjs/web'
import * as stylex from '@stylexjs/stylex'

import { i18n } from '#i18n'
import { createShadowRootUi, defineContentScript } from '#imports'

import { reportError } from '../../src/extension/client'
import { CounterPanel } from '../../src/ui/counter-panel'

// WXT injects this entry's CSS, StyleX rules included, into the Shadow Root.
import '../../../web/src/styles/reset.css'

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
						<div {...stylex.attrs(styles.widget)}>
							<CounterPanel
								title={i18n.t('content.title')}
								description={i18n.t('content.description')}
							/>
						</div>
					),
					container,
					undefined,
					// Root-scoped: hears only this tree's boundary-caught errors, never
					// the host page's; content scripts install no global handlers.
					{ onError: reportError },
				)
			},
			onRemove(dispose) {
				dispose?.()
			},
		})

		ui.mount()
	},
})

const MOBILE = '@media (max-width: 480px)'

const styles = stylex.create({
	widget: {
		position: 'fixed',
		zIndex: 2147483647,
		right: { default: '20px', [MOBILE]: '12px' },
		bottom: { default: '20px', [MOBILE]: '12px' },
		width: {
			default: 'min(340px, calc(100vw - 40px))',
			[MOBILE]: 'calc(100vw - 24px)',
		},
	},
})
