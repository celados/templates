import { onError, os } from '@orpc/server'
import { RPCHandler } from '@orpc/server/message-port'

import { browser, type Browser } from '#imports'

import { createCounterService } from './counter-service'
import { errorReportSchema } from './error-report'
import { RPC_PORT } from './port'
import { captureReport, type ErrorSink } from './telemetry'

type Context = { sender: Browser.runtime.MessageSender | undefined }

const procedure = os.$context<Context>()

/**
 * Everything UI roots may ask the background to do. Keep it to privileged or
 * serialized work; data a UI can read directly (storage, a backend client)
 * stays out of this surface so the worker does not become a data proxy. Inputs
 * are schema-validated: content scripts are untrusted callers.
 */
export function createRouter(errors: ErrorSink) {
	const counter = createCounterService()
	return {
		counter: {
			increment: procedure.handler(() => counter.increment()),
			reset: procedure.handler(() => counter.reset()),
		},
		diagnostics: {
			report: procedure
				.input(errorReportSchema)
				.handler(({ input }) => captureReport(errors, input)),
		},
	}
}

export type Router = ReturnType<typeof createRouter>

export function serveRouter(errors: ErrorSink): void {
	const handler = new RPCHandler(createRouter(errors), {
		interceptors: [onError((error) => errors(error, 'background'))],
	})
	browser.runtime.onConnect.addListener((port) => {
		// Other runtime.connect users (e.g. WXT dev tooling) are not RPC peers.
		if (port.name !== RPC_PORT) return
		handler.upgrade(port, { context: { sender: port.sender } })
	})
}
