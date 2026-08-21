import { Link } from '@tanstack/react-router'

import type { getPostPage } from '@/content/posts'

type PostPage = NonNullable<ReturnType<typeof getPostPage>>

export function PostList(props: PostPage) {
	const { page, pageCount, posts } = props
	return (
		<main className="mx-auto min-h-svh max-w-3xl space-y-8 px-6 py-16">
			<header className="space-y-3">
				<p className="text-sm text-muted-foreground">Page {page}</p>
				<h1 className="text-4xl font-semibold tracking-tight">Posts</h1>
			</header>
			<ul className="space-y-6">
				{posts.map((post) => (
					<li className="rounded-2xl border p-6" key={post.slug}>
						<Link
							className="text-xl font-semibold underline-offset-4 hover:underline"
							params={{ slug: post.slug }}
							to="/posts/$slug"
						>
							{post.title}
						</Link>
						<p className="mt-2 text-muted-foreground">{post.description}</p>
					</li>
				))}
			</ul>
			<nav className="flex gap-4" aria-label="Pagination">
				{page === 2 && <Link to="/posts">Previous</Link>}
				{page > 2 && (
					<Link params={{ page: String(page - 1) }} to="/posts/page/$page">
						Previous
					</Link>
				)}
				{page < pageCount && (
					<Link params={{ page: String(page + 1) }} to="/posts/page/$page">
						Next
					</Link>
				)}
			</nav>
		</main>
	)
}
