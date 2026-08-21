import { createFileRoute, notFound } from '@tanstack/react-router'

import { getPost, getPostMeta } from '@/content/posts'
import { seoHead } from '@/lib/seo'

export const Route = createFileRoute('/posts/$slug')({
	loader: (context) => {
		const post = getPostMeta(context.params.slug)
		if (!post) throw notFound()
		return post
	},
	head: (context) => {
		const post = context.loaderData
		if (!post) return {}
		return seoHead({
			title: `${post.title} · Calque Site`,
			description: post.description,
			path: `/posts/${post.slug}`,
			type: 'article',
		})
	},
	component: PostPage,
})

function PostPage() {
	const meta = Route.useLoaderData()
	const { slug } = Route.useParams()
	const post = getPost(slug)
	if (!post) throw notFound()
	const Content = post.Content
	return (
		<main className="mx-auto min-h-svh max-w-3xl px-6 py-16">
			<article className="prose-content">
				<header className="mb-10 space-y-3">
					<time
						className="text-sm text-muted-foreground"
						dateTime={meta.publishedAt}
					>
						{meta.publishedAt}
					</time>
					<h1 className="text-4xl font-semibold tracking-tight">
						{meta.title}
					</h1>
					<p className="text-lg text-muted-foreground">{meta.description}</p>
				</header>
				<Content />
			</article>
		</main>
	)
}
