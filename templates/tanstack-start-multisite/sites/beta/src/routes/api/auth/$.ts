import { createFileRoute } from '@tanstack/react-router'

import { handler } from '@/lib/auth.server'

export const Route = createFileRoute('/api/auth/$')({
	server: {
		handlers: {
			GET: (context) => handler(context.request),
			POST: (context) => handler(context.request),
		},
	},
})
