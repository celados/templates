import type { RouterClient } from '@orpc/server'

import { createORPCClient, DynamicLink } from '@orpc/client'
import { RPCLink } from '@orpc/client/message-port'

import { browser } from '#imports'

import type { Router } from './router'

import { toErrorReport } from './error-report'
import { RPC_PORT } from './port'

let link: RPCLink<object> | undefined

/**
 * RPCLink is bound to one port for life, but Chrome terminates an idle MV3
 * worker and disconnects its ports. Open a port lazily and replace it after a
 * disconnect; `runtime.connect` wakes the worker. A call in flight when the
 * worker dies rejects instead of retrying, since mutations are not idempotent.
 */
export const background: RouterClient<Router> = createORPCClient(
	new DynamicLink(() => {
		if (link) return link
		const port = browser.runtime.connect({ name: RPC_PORT })
		const current = new RPCLink({ port })
		port.onDisconnect.addListener(() => {
			if (link === current) link = undefined
		})
		return (link = current)
	}),
)

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
