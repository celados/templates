import type { Element } from 'solid-js'

import { cleanup, render, waitFor } from '@solidjs/testing-library'
import { ConvexClient } from 'convex/browser'
import { makeFunctionReference } from 'convex/server'
import {
	action,
	createOptimistic,
	createSignal,
	createRoot,
	Show,
	Errored,
	Loading,
	until,
} from 'solid-js'
import { afterEach, describe, expect, it, vi } from 'vite-plus/test'

import { ConvexProvider, createConvexQuery, useConvexClient } from './convex'

const query = makeFunctionReference<'query', { id: string }, string>(
	'test:value',
)

function transport() {
	const subscriptions: {
		args: { id: string }
		value: (value: string) => void
		error: (error: Error) => void
		unsubscribe: ReturnType<typeof vi.fn>
	}[] = []
	const onUpdate = vi.fn((_, args, value, error) => {
		const unsubscribe = Object.assign(vi.fn(), {
			getCurrentValue: () => undefined,
		})
		subscriptions.push({ args, value, error, unsubscribe })
		return unsubscribe
	}) as unknown as ConvexClient['onUpdate']
	const client = new ConvexClient('https://example.convex.cloud', {
		disabled: true,
	})
	vi.spyOn(client, 'onUpdate').mockImplementation(onUpdate)
	const close = vi.spyOn(client, 'close')
	return { client, subscriptions, close }
}

function renderWithClient(client: ConvexClient, view: () => Element) {
	return render(() => <ConvexProvider value={client}>{view()}</ConvexProvider>)
}

afterEach(cleanup)

describe('Convex live queries in Solid 2', () => {
	it('uses Loading, streams updates, switches arguments, skips, and disposes pending reads', async () => {
		const feed = transport()
		const [id, setId] = createSignal<string | null>('a')
		const view = renderWithClient(feed.client, () => {
			const value = createConvexQuery(query, () =>
				id() === null ? null : { id: id()! },
			)
			return (
				<Loading fallback={<p>Loading</p>}>
					<p>{value() ?? 'Skipped'}</p>
				</Loading>
			)
		})
		expect(view.getByText('Loading')).toBeDefined()
		await waitFor(() => expect(feed.subscriptions).toHaveLength(1))
		feed.subscriptions[0]!.value('A')
		await waitFor(() => expect(view.getByText('A')).toBeDefined())
		feed.subscriptions[0]!.value('A2')
		await waitFor(() => expect(view.getByText('A2')).toBeDefined())
		setId('b')
		await waitFor(() => expect(feed.subscriptions).toHaveLength(2))
		expect(feed.subscriptions[0]!.unsubscribe).toHaveBeenCalledTimes(1)
		feed.subscriptions[0]!.value('Late A')
		feed.subscriptions[1]!.value('B')
		await waitFor(() => expect(view.getByText('B')).toBeDefined())
		setId(null)
		await waitFor(() => expect(view.getByText('Skipped')).toBeDefined())
		expect(feed.subscriptions[1]!.unsubscribe).toHaveBeenCalledTimes(1)
		setId('c')
		await waitFor(() => expect(feed.subscriptions).toHaveLength(3))
		view.unmount()
		expect(feed.subscriptions[2]!.unsubscribe).toHaveBeenCalledTimes(1)
	})

	it('cancels an unresolved subscription when its arguments change', async () => {
		const feed = transport()
		const [id, setId] = createSignal('a')
		const view = renderWithClient(feed.client, () => {
			const value = createConvexQuery(query, () => ({ id: id() }))
			return (
				<Loading fallback={<p>Loading</p>}>
					<p>{value()}</p>
				</Loading>
			)
		})
		await waitFor(() => expect(feed.subscriptions).toHaveLength(1))
		setId('b')
		await waitFor(() => expect(feed.subscriptions).toHaveLength(2))
		expect(feed.subscriptions[0]!.unsubscribe).toHaveBeenCalledTimes(1)
		feed.subscriptions[0]!.value('Obsolete')
		feed.subscriptions[1]!.value('Current')
		await waitFor(() => expect(view.getByText('Current')).toBeDefined())
		expect(view.queryByText('Obsolete')).toBeNull()
	})

	it('routes subscription errors to Errored and releases the subscription', async () => {
		const feed = transport()
		const view = renderWithClient(feed.client, () => {
			const value = createConvexQuery(query, () => ({ id: 'a' }))
			return (
				<Errored fallback={() => <p>Failed</p>}>
					<Loading fallback={<p>Loading</p>}>
						<p>{value()}</p>
					</Loading>
				</Errored>
			)
		})
		await waitFor(() => expect(feed.subscriptions).toHaveLength(1))
		feed.subscriptions[0]!.error(new Error('Denied'))
		await waitFor(() => expect(view.getByText('Failed')).toBeDefined())
		expect(feed.subscriptions[0]!.unsubscribe).toHaveBeenCalledTimes(1)
	})

	it('composes native optimism with live confirmation and rolls back failures', async () => {
		const feed = transport()
		let save!: (value: string, response: Promise<void>) => Promise<unknown>
		const view = renderWithClient(feed.client, () => {
			const truth = createConvexQuery(query, () => ({ id: 'a' }))
			const [value, setValue] = createOptimistic(() => truth())
			save = action(function* (next: string, response: Promise<void>) {
				setValue(next)
				yield response
				// A live acknowledgment holds optimism until the source has landed.
				yield until(() => truth() === next, { timeout: 1000 })
			})
			return (
				<Loading fallback={<p>Loading</p>}>
					<p>{value()}</p>
				</Loading>
			)
		})
		await waitFor(() => expect(feed.subscriptions).toHaveLength(1))
		feed.subscriptions[0]!.value('A')
		await waitFor(() => expect(view.getByText('A')).toBeDefined())
		const response = Promise.withResolvers<void>()
		const saving = save('B', response.promise)
		await waitFor(() => expect(view.getByText('B')).toBeDefined())
		feed.subscriptions[0]!.value('Other writer')
		response.resolve()
		feed.subscriptions[0]!.value('B')
		await saving
		expect(view.getByText('B')).toBeDefined()
		const failure = Promise.withResolvers<void>()
		const failing = save('C', failure.promise)
		const rejected = expect(failing).rejects.toThrow('Rejected')
		await waitFor(() => expect(view.getByText('C')).toBeDefined())
		failure.reject(new Error('Rejected'))
		await rejected
		await waitFor(() => expect(view.getByText('B')).toBeDefined())
	})
})

describe('Convex context ownership', () => {
	it('requires a provider even when the query is skipped', () => {
		expect(() => createRoot(() => useConvexClient())).toThrow()
		expect(() =>
			createRoot(() => createConvexQuery(query, () => null)),
		).toThrow()
	})

	it('uses the nearest provider and only cleans up the removed subtree', async () => {
		const outer = transport()
		const inner = transport()
		const [visible, setVisible] = createSignal(true)
		const clients: ConvexClient[] = []
		function Reader(props: { id: string }) {
			clients.push(useConvexClient())
			const value = createConvexQuery(query, () => ({ id: props.id }))
			return (
				<Loading fallback={<p>Loading</p>}>
					<p>{value()}</p>
				</Loading>
			)
		}
		const view = render(() => (
			<ConvexProvider value={outer.client}>
				<Reader id="before" />
				<Show when={visible()}>
					<ConvexProvider value={inner.client}>
						<Reader id="inner" />
					</ConvexProvider>
				</Show>
				<Reader id="after" />
			</ConvexProvider>
		))
		await waitFor(() => {
			expect(outer.subscriptions).toHaveLength(2)
			expect(inner.subscriptions).toHaveLength(1)
		})
		expect(clients).toEqual([outer.client, inner.client, outer.client])
		outer.subscriptions[0]!.value('Before')
		outer.subscriptions[1]!.value('After')
		inner.subscriptions[0]!.value('Inner')
		await waitFor(() => expect(view.getByText('Inner')).toBeDefined())
		setVisible(false)
		await waitFor(() =>
			expect(inner.subscriptions[0]!.unsubscribe).toHaveBeenCalledTimes(1),
		)
		expect(outer.subscriptions[0]!.unsubscribe).not.toHaveBeenCalled()
		expect(outer.subscriptions[1]!.unsubscribe).not.toHaveBeenCalled()
		outer.subscriptions[1]!.value('Still live')
		await waitFor(() => expect(view.getByText('Still live')).toBeDefined())
		view.unmount()
		expect(outer.subscriptions[0]!.unsubscribe).toHaveBeenCalledTimes(1)
		expect(outer.subscriptions[1]!.unsubscribe).toHaveBeenCalledTimes(1)
		expect(inner.close).not.toHaveBeenCalled()
		expect(outer.close).not.toHaveBeenCalled()
	})

	it('isolates independent roots even when their query arguments match', async () => {
		const first = transport()
		const second = transport()
		function Reader() {
			const value = createConvexQuery(query, () => ({ id: 'same' }))
			return (
				<Loading fallback={<p>Loading</p>}>
					<p>{value()}</p>
				</Loading>
			)
		}
		const a = renderWithClient(first.client, () => <Reader />)
		const b = renderWithClient(second.client, () => <Reader />)
		await waitFor(() => {
			expect(first.subscriptions).toHaveLength(1)
			expect(second.subscriptions).toHaveLength(1)
		})
		first.subscriptions[0]!.value('First')
		second.subscriptions[0]!.value('Second')
		await waitFor(() => {
			expect(a.container.textContent).toBe('First')
			expect(b.container.textContent).toBe('Second')
		})
		a.unmount()
		expect(first.subscriptions[0]!.unsubscribe).toHaveBeenCalledTimes(1)
		expect(second.subscriptions[0]!.unsubscribe).not.toHaveBeenCalled()
		second.subscriptions[0]!.value('Independent')
		await waitFor(() => expect(b.container.textContent).toBe('Independent'))
		expect(first.close).not.toHaveBeenCalled()
	})
})
