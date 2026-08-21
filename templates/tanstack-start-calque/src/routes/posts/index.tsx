import { createFileRoute, notFound } from '@tanstack/react-router'

import { PostList } from '@/components/post-list'
import { getPostPage } from '@/content/posts'
import { seoHead } from '@/lib/seo'

export const Route = createFileRoute('/posts/')({
	loader: () => {
		const page = getPostPage(1)
		if (!page) throw notFound()
		return page
	},
	head: () =>
		seoHead({
			title: 'Posts · Calque Site',
			description: 'Build-time validated Markdown and MDX content.',
			path: '/posts',
		}),
	component: PostsPage,
})

function PostsPage() {
	const page = Route.useLoaderData()
	return <PostList {...page} />
}
