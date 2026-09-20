import type { AuditableLogger } from 'evlog'
import type { EvlogVariables } from 'evlog/hono'

// Wrangler cannot infer deployed secret names, so only secrets augment its generated Env.
export type WorkerBindings = Env & {
	BETTER_AUTH_SECRET: string
}

export type RpcContext = {
	env: WorkerBindings
	log: AuditableLogger
	request: Request
	requestId: string
}

export type AppEnvironment = EvlogVariables & {
	Bindings: WorkerBindings
}
