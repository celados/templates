import { createFileRoute } from '@tanstack/react-router'

import { publishedPosts } from '@/content/posts'
import { absoluteUrl } from '@/lib/seo'

function escapeXml(value: string) {
	return value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&apos;')
}

export const Route = createFileRoute('/rss.xml')({
	server: {
		handlers: {
			GET: async () => {
				const items = publishedPosts
					.map(
						(post) => `<item>
  <title>${escapeXml(post.title)}</title>
  <description>${escapeXml(post.description)}</description>
  <link>${escapeXml(absoluteUrl(`/posts/${post.slug}`))}</link>
  <guid>${escapeXml(absoluteUrl(`/posts/${post.slug}`))}</guid>
  <pubDate>${new Date(`${post.publishedAt}T00:00:00Z`).toUTCString()}</pubDate>
</item>`,
					)
					.join('\n')
				const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
<title>Calque Site</title>
<description>Build-time validated Markdown and MDX content.</description>
<link>${escapeXml(absoluteUrl('/'))}</link>
${items}
</channel></rss>`
				return new Response(body, {
					headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
				})
			},
		},
	},
})
