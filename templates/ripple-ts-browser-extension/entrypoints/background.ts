import { browser, defineBackground } from '#imports'

import { handleCounterCommand } from '../src/extension/counter-service'
import { isCounterCommand } from '../src/extension/protocol'

export default defineBackground(() => {
	// Chrome does not open a side panel from an action click unless the
	// extension opts into this behavior at runtime.
	void chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })

	browser.runtime.onMessage.addListener((message) => {
		if (!isCounterCommand(message)) {
			return undefined
		}

		return handleCounterCommand(message)
	})
})
