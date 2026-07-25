import type { AuthClient } from '@convex-dev/better-auth/react'
import type { ConvexQueryClient } from '@convex-dev/react-query'
import type { QueryClient } from '@tanstack/react-query'

import { ConvexBetterAuthProvider } from '@convex-dev/better-auth/react'
import { TanStackDevtools } from '@tanstack/react-devtools'
import {
	HeadContent,
	Outlet,
	Scripts,
	createRootRouteWithContext,
	useRouteContext,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { createServerFn } from '@tanstack/react-start'

import { authClient } from '@/lib/auth-client'
import { getToken } from '@/lib/auth-server'

import appCss from '../styles.css?url'

const getAuthToken = createServerFn({ method: 'GET' }).handler(async () =>
	getToken(),
)

type RouterContext = {
	convexQueryClient: ConvexQueryClient
	queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
	head: () => ({
		meta: [
			{
				charSet: 'utf-8',
			},
			{
				name: 'viewport',
				content: 'width=device-width, initial-scale=1',
			},
			{
				title: 'TanStack Start + Convex',
			},
		],
		links: [
			{
				rel: 'stylesheet',
				href: appCss,
			},
		],
	}),
	beforeLoad: async (options) => {
		const token = await getAuthToken()
		if (token) {
			// The browser provider owns client auth; this token authenticates SSR queries.
			options.context.convexQueryClient.serverHttpClient?.setAuth(token)
		}

		return {
			isAuthenticated: Boolean(token),
			token,
		}
	},
	component: RootComponent,
	notFoundComponent: () => (
		<main className="container mx-auto p-4 pt-16">
			<h1>404</h1>
			<p>The requested page could not be found.</p>
		</main>
	),
	shellComponent: RootDocument,
})

function RootComponent() {
	const context = useRouteContext({ from: Route.id })

	return (
		<ConvexBetterAuthProvider
			client={context.convexQueryClient.convexClient}
			// The current provider union loses Better Auth's inferred plugin tuple;
			// this is the documented client from the official TanStack guide.
			// https://labs.convex.dev/better-auth/framework-guides/tanstack-start
			authClient={authClient as unknown as AuthClient}
			initialToken={context.token}
		>
			<Outlet />
		</ConvexBetterAuthProvider>
	)
}

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<head>
				<HeadContent />
			</head>
			<body>
				{children}
				<TanStackDevtools
					config={{
						position: 'bottom-right',
					}}
					plugins={[
						{
							name: 'Tanstack Router',
							render: <TanStackRouterDevtoolsPanel />,
						},
					]}
				/>
				<Scripts />
			</body>
		</html>
	)
}
