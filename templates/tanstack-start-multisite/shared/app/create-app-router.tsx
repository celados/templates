import { ConvexQueryClient } from '@convex-dev/react-query'
import { QueryClient } from '@tanstack/react-query'
import {
	createRouter as createTanStackRouter,
	type AnyRoute,
} from '@tanstack/react-router'
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query'

export function createAppRouter<TRouteTree extends AnyRoute>(
	routeTree: TRouteTree,
) {
	const convexUrl = import.meta.env.VITE_CONVEX_URL
	if (!convexUrl) {
		throw new Error('VITE_CONVEX_URL is not configured')
	}

	const convexQueryClient = new ConvexQueryClient(convexUrl, {
		expectAuth: true,
	})
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				queryKeyHashFn: convexQueryClient.hashFn(),
				queryFn: convexQueryClient.queryFn(),
			},
		},
	})
	convexQueryClient.connect(queryClient)

	const router = createTanStackRouter({
		routeTree,
		scrollRestoration: true,
		defaultPreload: 'intent',
		defaultPreloadStaleTime: 0,
		context: {
			convexQueryClient,
			queryClient,
		},
	})
	setupRouterSsrQueryIntegration({
		router,
		queryClient,
	})

	return router
}
