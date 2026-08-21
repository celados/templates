import { describe, expect, test } from 'vite-plus/test'

import { createContentPages, loadPublishedContent } from './ssg-content'

describe('SSG content manifest', () => {
	test('validates, filters, and sorts content at build time', () => {
		const posts = loadPublishedContent(process.cwd(), '2026-08-20')
		expect(posts.map((post) => post.slug)).toEqual([
			'hello-static-sites',
			'mdx-components',
		])
	})

	test('enumerates dynamic and pagination routes', () => {
		expect(
			createContentPages(process.cwd(), '2026-08-20').map((page) => page.path),
		).toEqual([
			'/posts/hello-static-sites',
			'/posts/mdx-components',
			'/posts/page/2',
		])
	})
})
