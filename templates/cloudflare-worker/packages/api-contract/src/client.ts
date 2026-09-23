import type { RouterContractClient } from '@orpc/contract'

import { createORPCClient, onError } from '@orpc/client'
import { RPCLink } from '@orpc/client/fetch'
import { RequestValidationLinkPlugin } from '@orpc/contract/plugins'

import { contract } from './contract'

type RpcLinkOptions = ConstructorParameters<typeof RPCLink>[0]

export type ApiClientOptions = {
	fetch?: RpcLinkOptions['fetch']
	headers?: RpcLinkOptions['headers']
	// Omit in the browser to call the page's own origin.
	origin?: string
}

export function createApiClient(
	options: ApiClientOptions,
): RouterContractClient<typeof contract> {
	const link = new RPCLink({
		fetch: options.fetch,
		headers: options.headers,
		interceptors: [
			onError((error) => {
				console.error(error)
			}),
		],
		plugins: [new RequestValidationLinkPlugin(contract)],
		origin: options.origin,
		// The Worker mounts the handler here; the path is part of the contract.
		url: '/rpc',
	})

	return createORPCClient(link)
}
