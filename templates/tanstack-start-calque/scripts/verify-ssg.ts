import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'

import { createContentPages } from '../tooling/ssg-content'

const projectRoot = resolve(import.meta.dirname, '..')
const outputRoot = join(projectRoot, 'dist/client')
const buildDate =
	process.env.CONTENT_BUILD_DATE || new Date().toISOString().slice(0, 10)
const contentPaths = createContentPages(projectRoot, buildDate).map(
	(page) => page.path,
)
const htmlPaths = ['/', '/404', '/posts', ...contentPaths]
const failures: Array<string> = []

function htmlFile(path: string) {
	return path === '/'
		? join(outputRoot, 'index.html')
		: join(outputRoot, path.slice(1), 'index.html')
}

function expectFile(file: string, label: string) {
	if (!existsSync(file)) failures.push(`Missing ${label}: ${file}`)
}

function listFiles(directory: string): Array<string> {
	return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
		const file = join(directory, entry.name)
		return entry.isDirectory() ? listFiles(file) : [file]
	})
}

for (const path of htmlPaths) expectFile(htmlFile(path), `HTML for ${path}`)
for (const file of ['rss.xml', 'robots.txt', 'sitemap.xml', 'pages.json']) {
	expectFile(join(outputRoot, file), file)
}

const allFiles = existsSync(outputRoot) ? listFiles(outputRoot) : []
for (const format of ['.avif', '.webp']) {
	if (!allFiles.some((file) => extname(file) === format)) {
		failures.push(`Missing optimized ${format} image artifact`)
	}
}

for (const path of htmlPaths) {
	const file = htmlFile(path)
	if (!existsSync(file)) continue
	const html = readFileSync(file, 'utf8')
	if (!html.includes('rel="canonical"'))
		failures.push(`Missing canonical URL in ${path}`)
	if (!html.includes('property="og:title"'))
		failures.push(`Missing Open Graph title in ${path}`)

	for (const match of html.matchAll(/<a\b[^>]*\bhref="([^"]+)"/g)) {
		const href = match[1]
		if (!href.startsWith('/') || href.startsWith('//')) continue
		const target = href.split(/[?#]/, 1)[0] || '/'
		const targetFile = extname(target)
			? join(outputRoot, target.slice(1))
			: htmlFile(target.replace(/\/$/, '') || '/')
		if (!existsSync(targetFile))
			failures.push(`Broken internal link in ${path}: ${href}`)
	}
}

const sitemapFile = join(outputRoot, 'sitemap.xml')
if (existsSync(sitemapFile)) {
	const sitemap = readFileSync(sitemapFile, 'utf8')
	for (const path of ['/', '/posts', ...contentPaths]) {
		if (!sitemap.includes(path === '/' ? '<loc>' : path)) {
			failures.push(`Sitemap is missing ${path}`)
		}
	}
}

const rssFile = join(outputRoot, 'rss.xml')
if (existsSync(rssFile)) {
	const rss = readFileSync(rssFile, 'utf8')
	for (const path of contentPaths.filter(
		(path) => path.startsWith('/posts/') && !path.includes('/page/'),
	)) {
		if (!rss.includes(path)) failures.push(`RSS is missing ${path}`)
	}
}

const robotsFile = join(outputRoot, 'robots.txt')
if (
	existsSync(robotsFile) &&
	!readFileSync(robotsFile, 'utf8').includes('/sitemap.xml')
) {
	failures.push('robots.txt does not advertise sitemap.xml')
}

if (failures.length > 0) {
	throw new AggregateError(
		failures.map((message) => new Error(message)),
		'SSG verification failed',
	)
}

console.info(
	`Verified ${htmlPaths.length} HTML pages and ${allFiles.length} static artifacts.`,
)
