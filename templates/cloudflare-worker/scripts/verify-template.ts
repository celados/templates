#!/usr/bin/env bun

import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = resolve(import.meta.dir, '..')
const forbiddenPackage = ['@orpc', 'openapi'].join('/')
const sourceGlob = new Bun.Glob('{src,packages}/**/*.{ts,json}')
const violations: string[] = []

const rootPackageSource = await readFile(resolve(root, 'package.json'), 'utf8')
if (rootPackageSource.includes(forbiddenPackage)) {
	violations.push('package.json: forbidden OpenAPI dependency')
}
if (rootPackageSource.includes('@cloudflare/workers-types')) {
	violations.push(
		'package.json: Wrangler-generated types must own Worker globals',
	)
}

for await (const path of sourceGlob.scan({ cwd: root })) {
	const source = await readFile(resolve(root, path), 'utf8')
	if (source.includes(forbiddenPackage)) {
		violations.push(`${path}: forbidden OpenAPI dependency or import`)
	}
}

const contractSourceGlob = new Bun.Glob('packages/api-contract/src/**/*.ts')
const forbiddenContractImports = ['@/auth', '@/db', '@orpc/server', 'hono']

for await (const path of contractSourceGlob.scan({ cwd: root })) {
	const source = await readFile(resolve(root, path), 'utf8')
	for (const forbiddenImport of forbiddenContractImports) {
		if (source.includes(`from '${forbiddenImport}`)) {
			violations.push(
				`${path}: contract boundary imports implementation package ${forbiddenImport}`,
			)
		}
	}
}

const contractSource = await readFile(
	resolve(root, 'packages/api-contract/src/contract.ts'),
	'utf8',
)
const clientSource = await readFile(
	resolve(root, 'packages/api-contract/src/client.ts'),
	'utf8',
)
const routerSource = await readFile(resolve(root, 'src/router.ts'), 'utf8')
const wranglerSource = await readFile(resolve(root, 'wrangler.jsonc'), 'utf8')

for (const marker of ['asyncIteratorObject(type<', 'type<', 'v.file()']) {
	if (!contractSource.includes(marker)) {
		violations.push(`contract is missing required capability: ${marker}`)
	}
}

if (
	/\.output\(\s*(?!type<|asyncIteratorObject\(\s*type<)/.test(contractSource)
) {
	violations.push(
		'every procedure output must use an oRPC TypeScript type helper',
	)
}

if (clientSource.includes('ResponseValidationLinkPlugin')) {
	violations.push('client must not runtime-validate procedure outputs')
}

for (const marker of [
	'contractImplementer.use(traceMiddleware)',
	'publicProcedures.use(databaseMiddleware)',
]) {
	if (!routerSource.includes(marker)) {
		violations.push(`router is missing reusable procedure layer: ${marker}`)
	}
}

if (!wranglerSource.includes('"binding": "HYPERDRIVE"')) {
	violations.push('wrangler.jsonc is missing the HYPERDRIVE binding')
}

if (violations.length > 0) {
	throw new Error(violations.join('\n'))
}

console.log(
	'Verified RPC-only contract, TypeScript outputs, SSE, file transfer, and Hyperdrive',
)
