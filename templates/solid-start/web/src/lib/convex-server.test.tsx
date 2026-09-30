import { makeFunctionReference } from 'convex/server'
import { afterEach, expect, it, vi } from 'vite-plus/test'

import type { ServerConvex } from './convex'

import { serverConvex } from './convex-server'

// The render's request event, as the Worker's middleware chain provides it.
const event = { locals: {} as { convex?: ServerConvex } }
vi.mock('@solidjs/web', async (original) => ({
	...(await original<typeof import('@solidjs/web')>()),
	getRequestEvent: () => event,
}))

const current = makeFunctionReference<
	'query',
	Record<string, never>,
	{ path: string }
>('auth:currentUser')
const list = makeFunctionReference<
	'query',
	{ limit: number },
	{ path: string }
>('todos:list')

afterEach(() => vi.unstubAllGlobals())

/** Convex over HTTP: the session's token, then one answer per query request. */
function convexOverHttp() {
	const asked: string[] = []
	vi.stubGlobal(
		'fetch',
		vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
			const url = String(input instanceof Request ? input.url : input)
			if (url.endsWith('/api/auth/convex/token'))
				return Response.json({ token: 'jwt' })
			const { path, args } = JSON.parse(init?.body as string) as {
				path: string
				args: unknown[]
			}
			asked.push(`${path} ${JSON.stringify(args)}`)
			return Response.json({ status: 'success', value: { path } })
		}),
	)
	return asked
}

async function signedInRender() {
	const request = new Request('https://app.example/', {
		headers: { cookie: '__Secure-better-auth.session_token=session' },
	})
	const middleware = serverConvex({
		url: 'https://deployment.convex.cloud',
		site: 'https://deployment.convex.site',
	})
	await middleware(request, async () => new Response())
	return event.locals.convex!
}

// A <Loading> boundary re-runs its children until nothing in them is pending,
// and a query created in them asks again on every pass. With a fresh pending
// answer each time the boundary never settles: the Worker spends its CPU on
// 10001 passes and the document ends after the shell.
it('answers the same question once per render, so a retried boundary reads the settled answer', async () => {
	const asked = convexOverHttp()
	const convex = await signedInRender()

	const first = convex.query(current, {})
	await first
	const again = convex.query(current, {})

	expect(again).toBe(first)
	expect(await again).toEqual({ path: 'auth:currentUser' })
	// A different question is its own request.
	await convex.query(list, { limit: 50 })
	expect(asked).toEqual(['auth:currentUser [{}]', 'todos:list [{"limit":50}]'])
})
