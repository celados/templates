import { createProxyService } from '@webext-core/proxy-service'

import { toErrorReport } from './error-report'
import { BACKGROUND_SERVICE_KEY } from './services'

export const background = createProxyService(BACKGROUND_SERVICE_KEY)

// Extension pages report their path; content scripts never report the host
// page URL, which may be private to the user.
const context =
	location.protocol === 'chrome-extension:'
		? location.pathname
		: 'content-script'

/** Forward an error to the background's reporter. Never throws. */
export function reportError(error: unknown): void {
	void background.diagnostics
		.report(toErrorReport(error, context))
		.catch((cause: unknown) => console.error(error, cause))
}
