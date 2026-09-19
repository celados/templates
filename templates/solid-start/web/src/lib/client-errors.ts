import { isServer } from '@solidjs/web'
import { configureClientErrors } from 'solid-js'

// An error an <Errored> boundary catches never reaches window.onerror; Solid
// reports it here once. Uncaught errors still go to the platform's reportError.
// Replace console.error with your monitor's capture call, keeping the paths.
// https://v2.solidjs.com/guides/observability
if (!isServer) {
	configureClientErrors({
		onError(error, { ownerPath, boundaryPath }) {
			console.error(error, {
				thrownIn: ownerPath?.join(' › '),
				caughtBy: boundaryPath?.join(' › '),
			})
		},
	})
}
