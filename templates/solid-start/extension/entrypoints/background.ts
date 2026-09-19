import { defineBackground } from '#imports'

import { serveRouter } from '../src/extension/router'
import { createErrorSink } from '../src/extension/telemetry'

export default defineBackground(() => {
	const errors = createErrorSink()

	// A connection that wakes the worker is dispatched right after startup, so the
	// listener must be registered synchronously, before any await.
	serveRouter(errors)

	// The worker global belongs to the extension, so global handlers are safe
	// here, unlike in content scripts, where they would see host-page errors.
	self.addEventListener('error', (event) => errors(event.error, 'background'))
	self.addEventListener('unhandledrejection', (event) =>
		errors(event.reason, 'background'),
	)

	// Chrome does not open a side panel from an action click unless the
	// extension opts into this behavior at runtime.
	void chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
})
