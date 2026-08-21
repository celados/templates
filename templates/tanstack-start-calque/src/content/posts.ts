import type { ComponentType } from 'react'

import { parsePostFrontmatter } from './post-schema'

const postsPerPage = 1

type ContentModule = {
	default: ComponentType
	frontmatter: unknown
}

export type Post = ReturnType<typeof createPost>
export type PostMeta = Omit<Post, 'Content'>

const modules = import.meta.glob<ContentModule>(
	'../../content/posts/**/*.{md,mdx}',
	{ eager: true },
)

function slugFromModulePath(path: string) {
	return path
		.replace(/^\.\.\/\.\.\/content\/posts\//, '')
		.replace(/\.mdx?$/, '')
		.replace(/\/index$/, '')
}

function createPost(path: string, module: ContentModule) {
	const frontmatter = parsePostFrontmatter(module.frontmatter, path)
	return {
		...frontmatter,
		slug: slugFromModulePath(path),
		Content: module.default,
	}
}

export const publishedPosts = Object.entries(modules)
	.map(([path, module]) => createPost(path, module))
	.filter((post) => !post.draft && post.publishedAt <= __CONTENT_BUILD_DATE__)
	.sort((left, right) => right.publishedAt.localeCompare(left.publishedAt))

export function getPost(slug: string) {
	return publishedPosts.find((post) => post.slug === slug)
}

export function getPostMeta(slug: string): PostMeta | undefined {
	const post = getPost(slug)
	if (!post) return undefined
	const { Content: _Content, ...meta } = post
	return meta
}

export function getPostPage(page: number) {
	const pageCount = Math.ceil(publishedPosts.length / postsPerPage)
	if (!Number.isInteger(page) || page < 1 || page > pageCount) return undefined

	const start = (page - 1) * postsPerPage
	return {
		page,
		pageCount,
		posts: publishedPosts.slice(start, start + postsPerPage).map((post) => {
			const { Content: _Content, ...meta } = post
			return meta
		}),
	}
}
