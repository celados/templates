import { configureServerErrors } from '@solidjs/web'

// Server failures Solid handles (an <Errored> fallback in the stream, a rejected
// <Loading> fragment, a failed request) never reach a global handler. One JSON
// line per failure lands in Workers Logs; returning nothing keeps Solid's
// sanitized client-facing error. Monitor SDKs that patch modules init here too.
// https://v2.solidjs.com/guides/observability
configureServerErrors({
	onError(error, { kind, handling, ownerPath, boundaryPath, event }) {
		console.error(
			JSON.stringify({
				solid: `${kind}/${handling}`,
				url: event?.request.url,
				thrownIn: ownerPath?.join(' › '),
				caughtBy: boundaryPath?.join(' › '),
				error: error instanceof Error ? error.stack : String(error),
			}),
		)
	},
})
