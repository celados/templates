import type { AuthClient } from '@convex-dev/better-auth/react'
import type { ConvexQueryClient } from '@convex-dev/react-query'
import type { QueryClient } from '@tanstack/react-query'

import { ConvexBetterAuthProvider } from '@convex-dev/better-auth/react'
import {
	HeadContent,
	Outlet,
	Scripts,
	createRootRouteWithContext,
	useRouteContext,
} from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { lazy, Suspense, useEffect, useState } from 'react'

import { DefaultError } from '@/components/default-error'
import { NotFound } from '@/components/not-found'
import { authClient } from '@/lib/auth-client'
import { getToken } from '@/lib/auth.server'

import appCss from '../styles.css?url'

const getAuthToken = createServerFn({ method: 'GET' }).handler(async () =>
	getToken(),
)

const LazyAppDevtools = import.meta.env.DEV
	? lazy(() =>
			import('@/components/app-devtools').then((module) => ({
				default: module.AppDevtools,
			})),
		)
	: null

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
				name: 'description',
				content: 'A production-ready TanStack Start application.',
			},
			{
				name: 'theme-color',
				content: '#ffffff',
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
	errorComponent: DefaultError,
	notFoundComponent: NotFound,
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
			<body className="min-h-screen">
				{children}
				{LazyAppDevtools ? <DevelopmentTools /> : null}
				<Scripts />
			</body>
		</html>
	)
}

function DevelopmentTools() {
	const [isReady, setIsReady] = useState(false)

	useEffect(() => {
		// Let application hydration and route data win the initial main-thread budget.
		const timeout = window.setTimeout(() => setIsReady(true), 2_000)
		return () => window.clearTimeout(timeout)
	}, [])

	if (!isReady || !LazyAppDevtools) return null

	return (
		<Suspense fallback={null}>
			<LazyAppDevtools />
		</Suspense>
	)
}
