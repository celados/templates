import { createRouter as createTanStackRouter } from '@tanstack/react-router'

import { routeTree } from './route-tree.gen'

export function getRouter() {
	return createTanStackRouter({
		routeTree,
		trailingSlash: 'never',
		scrollRestoration: true,
		defaultPreload: 'intent',
		defaultPreloadStaleTime: 0,
	})
}

declare module '@tanstack/react-router' {
	interface Register {
		router: ReturnType<typeof getRouter>
	}
}
