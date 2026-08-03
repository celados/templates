import { createAppRouter } from '@/app/create-app-router'

import { routeTree } from './route-tree.gen'

export function getRouter() {
	return createAppRouter(routeTree)
}

declare module '@tanstack/react-router' {
	interface Register {
		router: ReturnType<typeof getRouter>
	}
}

declare module '@tanstack/react-start' {
	interface Register {
		ssr: true
		router: ReturnType<typeof getRouter>
	}
}
