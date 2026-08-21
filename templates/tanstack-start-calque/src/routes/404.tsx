import { createFileRoute } from '@tanstack/react-router'

import { NotFound } from '@/components/not-found'
import { seoHead } from '@/lib/seo'

export const Route = createFileRoute('/404')({
	head: () => {
		const seo = seoHead({
			title: 'Not found · Calque Site',
			description: 'The requested page does not exist.',
			path: '/404',
		})
		return {
			...seo,
			meta: [...seo.meta, { name: 'robots', content: 'noindex' }],
		}
	},
	component: NotFound,
})
