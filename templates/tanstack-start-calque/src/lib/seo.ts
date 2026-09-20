type SeoInput = {
	title: string
	description: string
	path: string
	type?: 'article' | 'website'
}

const siteUrl = (
	import.meta.env.VITE_SITE_URL || 'https://example.com'
).replace(/\/$/, '')

export function absoluteUrl(path: string) {
	return new URL(path, `${siteUrl}/`).toString()
}

export function seoHead(input: SeoInput) {
	const { title, description, path, type = 'website' } = input
	const url = absoluteUrl(path)
	return {
		meta: [
			{ title },
			{ name: 'description', content: description },
			{ property: 'og:title', content: title },
			{ property: 'og:description', content: description },
			{ property: 'og:type', content: type },
			{ property: 'og:url', content: url },
			{ name: 'twitter:card', content: 'summary' },
			{ name: 'twitter:title', content: title },
			{ name: 'twitter:description', content: description },
		],
		links: [{ rel: 'canonical', href: url }],
	}
}
