import type { ContractRouterClient } from '@orpc/contract'

import { createORPCClient, onError } from '@orpc/client'
import { RPCLink } from '@orpc/client/fetch'
import { RequestValidationPlugin } from '@orpc/contract/plugins'

import { contract } from './contract'

type RpcLinkOptions = ConstructorParameters<typeof RPCLink>[0]

export type ApiClientOptions = {
	fetch?: RpcLinkOptions['fetch']
	headers?: RpcLinkOptions['headers']
	url: string
}

export function createApiClient(
	options: ApiClientOptions,
): ContractRouterClient<typeof contract> {
	const link = new RPCLink({
		fetch: options.fetch,
		headers: options.headers,
		interceptors: [
			onError((error) => {
				console.error(error)
			}),
		],
		plugins: [new RequestValidationPlugin(contract)],
		url: options.url,
	})

	return createORPCClient(link)
}
