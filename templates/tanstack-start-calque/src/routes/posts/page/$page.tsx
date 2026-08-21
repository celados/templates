import { createFileRoute, notFound } from '@tanstack/react-router'

import { PostList } from '@/components/post-list'
import { getPostPage } from '@/content/posts'
import { seoHead } from '@/lib/seo'

export const Route = createFileRoute('/posts/page/$page')({
	loader: (context) => {
		const page = getPostPage(Number(context.params.page))
		if (!page) throw notFound()
		return page
	},
	head: (context) => {
		const page = context.loaderData
		if (!page) return {}
		return seoHead({
			title: `Posts page ${page.page} · Calque Site`,
			description: 'Build-time validated Markdown and MDX content.',
			path: `/posts/page/${page.page}`,
		})
	},
	component: PaginatedPostsPage,
})

function PaginatedPostsPage() {
	const page = Route.useLoaderData()
	return <PostList {...page} />
}
