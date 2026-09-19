import { action, createMemo, createOptimistic } from 'solid-js'

import { background, reportError } from '../extension/client'
import { counterItem } from '../extension/counter-store'
import { live } from '../extension/live'

/**
 * One counter view per UI root. Storage is the authority: mutations run in the
 * background, and the confirmed value arrives through the storage watch in
 * every open context, so there is no local copy to reconcile.
 */
export function createCounter() {
	const count$ = createMemo(() => live(counterItem))
	const [pending, setPending] = createOptimistic(false)
	const send = action(function* (mutation: 'increment' | 'reset') {
		setPending(true)
		yield background.counter[mutation]()
	})
	// Click handlers discard the promise, so failures are reported here rather
	// than surfacing as unhandled rejections in a host page's console.
	const run = (mutation: 'increment' | 'reset') =>
		send(mutation).catch(reportError)
	return {
		count$,
		pending,
		increment: () => run('increment'),
		reset: () => run('reset'),
	}
}
