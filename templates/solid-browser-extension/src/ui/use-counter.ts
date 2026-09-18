import { action, createMemo, createOptimistic } from 'solid-js'

import { sendCounterCommand } from '../extension/client'
import { counterStream } from '../extension/counter-source'

/**
 * One counter view per UI root. Storage is the authority: commands go to the
 * background, and the confirmed value arrives through the storage watch in
 * every open context, so there is no local copy to reconcile.
 */
export function createCounter() {
	const count$ = createMemo(() => counterStream())
	const [pending, setPending] = createOptimistic(false)
	const send = action(function* (type: 'counter:increment' | 'counter:reset') {
		setPending(true)
		yield sendCounterCommand({ type })
	})
	return {
		count$,
		pending,
		increment: () => send('counter:increment'),
		reset: () => send('counter:reset'),
	}
}
