import { onError } from '@orpc/server'
import { RPCHandler } from '@orpc/server/fetch'
import { RequestLimitHandlerPlugin } from '@orpc/server/plugins'
import { initLogger } from 'evlog'
import { evlog } from 'evlog/hono'
import { Hono } from 'hono'
import { cors } from 'hono/cors'

import type { AppEnvironment } from './context'

import { handleAuthRequest } from './auth-handler'
import { router } from './router'

initLogger({
	env: {
		service: 'cloudflare-worker-template',
	},
})

const app = new Hono<AppEnvironment>()

app.use('*', evlog())

app.use(
	'*',
	cors({
		// oRPC sends root-level File/Blob bodies with these two headers; browsers
		// hide them cross-origin unless listed. https://orpc.dev/docs/binary-data
		allowHeaders: [
			'Authorization',
			'Content-Disposition',
			'Content-Type',
			'Standard-Server',
		],
		allowMethods: ['GET', 'POST', 'OPTIONS'],
		credentials: true,
		exposeHeaders: ['Content-Disposition', 'Standard-Server'],
		origin: (origin, context) => {
			return origin === context.env.CORS_ORIGIN ? origin : undefined
		},
	}),
)

app.on(['GET', 'POST'], '/api/auth/*', (context) => {
	return handleAuthRequest(context.req.raw, context.env)
})

const rpcHandler = new RPCHandler(router, {
	interceptors: [
		onError((error) => {
			console.error(error)
		}),
	],
	plugins: [
		new RequestLimitHandlerPlugin({
			maxBodySize: 10 * 1024 * 1024,
		}),
	],
})

app.use('/rpc/*', async (context, next) => {
	const result = await rpcHandler.handle(context.req.raw, {
		context: {
			env: context.env,
			log: context.get('log'),
			request: context.req.raw,
			requestId: context.req.header('cf-ray') ?? crypto.randomUUID(),
		},
		prefix: '/rpc',
	})

	if (result.matched) {
		return context.newResponse(result.response.body, result.response)
	}

	await next()
})

app.get('/', (context) => {
	return context.json({
		auth: '/api/auth',
		protocol: 'oRPC',
		rpc: '/rpc',
	})
})

app.notFound((context) => {
	return context.json({ error: 'Not found' }, 404)
})

export { app }
export default app
