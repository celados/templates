import matter from 'gray-matter'
import { readdirSync, readFileSync } from 'node:fs'
import { extname, join, relative, resolve, sep } from 'node:path'

import { parsePostFrontmatter } from '../src/content/post-schema'

const contentExtensions = new Set(['.md', '.mdx'])
const postsPerPage = 1

type ContentFile = {
	file: string
	slug: string
	publishedAt: string
}

function listContentFiles(directory: string): Array<string> {
	return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
		const path = join(directory, entry.name)
		if (entry.isDirectory()) return listContentFiles(path)
		return contentExtensions.has(extname(entry.name)) ? [path] : []
	})
}

function contentSlug(file: string, contentRoot: string) {
	return relative(contentRoot, file)
		.split(sep)
		.join('/')
		.replace(/\.mdx?$/, '')
		.replace(/\/index$/, '')
}

export function loadPublishedContent(
	projectRoot: string,
	buildDate = new Date().toISOString().slice(0, 10),
): Array<ContentFile> {
	const contentRoot = resolve(projectRoot, 'content/posts')
	const seen = new Set<string>()

	return listContentFiles(contentRoot)
		.map((file) => {
			const document = matter(readFileSync(file, 'utf8'))
			const frontmatter = parsePostFrontmatter(document.data, file)
			const slug = contentSlug(file, contentRoot)
			if (!slug || seen.has(slug)) {
				throw new Error(`Duplicate or empty content slug: ${slug || file}`)
			}
			seen.add(slug)
			return {
				file,
				slug,
				...frontmatter,
			}
		})
		.filter((post) => !post.draft && post.publishedAt <= buildDate)
		.sort((left, right) => right.publishedAt.localeCompare(left.publishedAt))
}

export function createContentPages(projectRoot: string, buildDate?: string) {
	const posts = loadPublishedContent(projectRoot, buildDate)
	const pageCount = Math.ceil(posts.length / postsPerPage)
	const postPages = posts.map((post) => ({
		path: `/posts/${post.slug}`,
		sitemap: { lastmod: post.publishedAt, changefreq: 'monthly' as const },
	}))
	const paginationPages = Array.from(
		{ length: Math.max(0, pageCount - 1) },
		(_, index) => ({
			path: `/posts/page/${index + 2}`,
			sitemap: { changefreq: 'weekly' as const },
		}),
	)
	return [...postPages, ...paginationPages]
}
