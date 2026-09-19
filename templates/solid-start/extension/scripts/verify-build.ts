import { resolve } from 'node:path'

type Manifest = {
	action?: unknown
	background?: {
		service_worker?: string
	}
	content_scripts?: Array<{
		matches?: string[]
	}>
	default_locale?: string
	host_permissions?: string[]
	manifest_version?: number
	permissions?: string[]
	side_panel?: {
		default_path?: string
	}
}

const outputDirectory = resolve(import.meta.dir, '../.output/chrome-mv3')
const manifestPath = resolve(outputDirectory, 'manifest.json')
const manifest = (await Bun.file(manifestPath).json()) as Manifest

assert(manifest.manifest_version === 3, 'Expected a Manifest V3 build')
assert(
	manifest.background?.service_worker === 'background.js',
	'Expected an MV3 background service worker',
)
assert(
	manifest.side_panel?.default_path === 'sidepanel.html',
	'Expected the side panel entrypoint',
)
assert(
	manifest.content_scripts?.some((script) =>
		script.matches?.includes('https://example.com/*'),
	) ?? false,
	'Expected the example.com content script',
)
assert(
	sameMembers(manifest.permissions ?? [], ['sidePanel', 'storage']),
	'Expected only storage and sidePanel permissions',
)
assert(
	manifest.default_locale !== undefined &&
		(await Bun.file(
			resolve(
				outputDirectory,
				'_locales',
				manifest.default_locale,
				'messages.json',
			),
		).exists()),
	'Expected compiled messages for the default locale',
)
assert(
	(manifest.host_permissions?.length ?? 0) === 0,
	'Host permissions must stay empty until a feature requires them',
)

console.log(
	'Verified MV3 manifest, entrypoints, locales, and least-privilege permissions',
)

function assert(condition: boolean, message: string): asserts condition {
	if (!condition) {
		throw new Error(message)
	}
}

function sameMembers(actual: string[], expected: string[]): boolean {
	return (
		actual.length === expected.length &&
		actual.every((value) => expected.includes(value))
	)
}
