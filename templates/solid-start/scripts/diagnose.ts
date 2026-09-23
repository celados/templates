#!/usr/bin/env bun

// Loads pages from the running dev server in the system Chrome and fails on
// anything that should keep a change from being called done: a Solid dev
// diagnostic, an uncaught page error, or a console error. Diagnostics exist
// only in dev builds, which is why this drives `bun run dev` and not a
// production preview.
//
//   bun run diagnose [path ...] [--base <url>] [--script <module>]
//                    [--allow <regex> ...] [--headed]
//
// `--script` names a module whose default export runs after each page loads:
// `export default async (page: Page, path: string) => { ... }`. Its
// interactions fall inside the same capture.

import type { Page } from 'playwright-core'

import { pathToFileURL } from 'node:url'
import { parseArgs } from 'node:util'
import { chromium } from 'playwright-core'

type Finding = { kind: string; text: string }
type Interaction = (page: Page, path: string) => unknown

const { values, positionals } = parseArgs({
	allowPositionals: true,
	options: {
		base: { type: 'string', default: 'http://localhost:3000' },
		script: { type: 'string' },
		allow: { type: 'string', multiple: true, default: [] },
		headed: { type: 'boolean', default: false },
	},
})

const base = values.base
const paths = positionals.length > 0 ? positionals : ['/']
const allowed = values.allow.map((pattern) => new RegExp(pattern))
const interact: Interaction | undefined = values.script
	? (await import(pathToFileURL(values.script).href)).default
	: undefined

try {
	await fetch(base, { method: 'HEAD' })
} catch {
	console.error(
		`No dev server at ${base}. Start it with \`bun run dev\` first.`,
	)
	process.exit(2)
}

// System Chrome only: this template never downloads a bundled browser.
const browser = await chromium.launch({
	channel: 'chrome',
	headless: !values.headed,
})
let failed = false

try {
	for (const path of paths) {
		const findings = await diagnose(path)
		const reported = findings.filter(
			(finding) => !allowed.some((pattern) => pattern.test(finding.text)),
		)
		failed ||= reported.length > 0
		console.log(`${reported.length === 0 ? 'ok  ' : 'FAIL'} ${path}`)
		for (const finding of reported) {
			console.log(`     ${finding.kind}: ${finding.text}`)
		}
	}
} finally {
	await browser.close()
}

process.exit(failed ? 1 : 0)

async function diagnose(path: string): Promise<Finding[]> {
	const href = new URL(path, base).href
	const page = await browser.newPage()
	const findings: Finding[] = []
	page.on('pageerror', (error) =>
		findings.push({ kind: 'page error', text: error.message }),
	)
	page.on('console', (message) => {
		if (message.type() !== 'error') return
		// A failed resource logs only its status; the location names it.
		const { url } = message.location()
		// The document's own status is the route's answer (a 404 page returns
		// 404); it is judged below, not as a console error.
		if (url === href) return
		const text = message.text()
		findings.push({
			kind: 'console error',
			text: url && !text.includes(url) ? `${text} (${url})` : text,
		})
	})
	// The dev server injects the diagnostics bridge as a plain global
	// assignment; opening the capture from its setter covers hydration too.
	await page.addInitScript(() => {
		let bridge: { begin(options?: object): void } | undefined
		Object.defineProperty(globalThis, '__SOLID_DIAGNOSTICS__', {
			configurable: true,
			get: () => bridge,
			set(value) {
				bridge = value
				value.begin({ attribution: false })
			},
		})
	})

	try {
		const response = await page.goto(href, { waitUntil: 'networkidle' })
		if (response && response.status() >= 500) {
			findings.push({ kind: 'http', text: `${response.status()} for ${href}` })
		}
		try {
			await interact?.(page, path)
		} catch (error) {
			findings.push({
				kind: 'interaction',
				text:
					error instanceof Error
						? error.message.split('\n')[0]!
						: String(error),
			})
		}
		const payload = await page.evaluate(() => {
			const bridge = (globalThis as Record<string, any>).__SOLID_DIAGNOSTICS__
			return bridge?.active() ? bridge.end() : null
		})
		if (!payload) {
			findings.push({
				kind: 'setup',
				text: 'no diagnostics bridge; is @solidjs/diagnostics a dev dependency and the page served by `vp dev`?',
			})
		}
		for (const event of payload?.diagnostics ?? []) {
			const where = event.ownerPath?.length
				? ` in ${event.ownerPath.join(' › ')}`
				: ''
			findings.push({
				kind: `${event.severity} ${event.code}`,
				text: `${event.message}${where}`,
			})
		}
	} finally {
		await page.close()
	}
	return findings
}
