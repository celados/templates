import { registerService } from '@webext-core/proxy-service'

import { createCounterService } from './counter-service'
import { type ErrorReport, parseErrorReport } from './error-report'
import { BACKGROUND_SERVICE_KEY } from './services'
import { captureReport, type ErrorSink } from './telemetry'

export type BackgroundService = ReturnType<typeof createBackgroundService>

/**
 * Everything UI roots may ask the background to do. Keep it to privileged or
 * serialized work; data a UI can read directly (storage, a backend client)
 * stays out of this surface so the worker does not become a data proxy.
 */
export function createBackgroundService(errors: ErrorSink) {
	return exposed({
		counter: exposed(createCounterService()),
		diagnostics: exposed({
			// Typed for callers, validated for reality: any content script can
			// send any JSON here.
			report: async (value: ErrorReport): Promise<void> => {
				const report = parseErrorReport(value)
				if (report) captureReport(errors, report)
			},
		}),
	})
}

export function registerBackgroundService(errors: ErrorSink) {
	registerService(BACKGROUND_SERVICE_KEY, createBackgroundService(errors))
}

/**
 * Proxy-service resolves any property path a sender names. Content scripts are
 * untrusted callers, so strip the prototype chain and freeze each level to make
 * the declared methods the only reachable targets.
 */
function exposed<T extends object>(methods: T): Readonly<T> {
	return Object.freeze(Object.assign(Object.create(null) as T, methods))
}
