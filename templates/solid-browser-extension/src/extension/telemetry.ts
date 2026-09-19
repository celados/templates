import {
	BrowserClient,
	defaultStackParser,
	getDefaultIntegrations,
	makeFetchTransport,
	Scope,
} from '@sentry/browser'

import { browser } from '#imports'

import type { ErrorReport } from './error-report'

export type ErrorSink = (error: unknown, context: string) => void

/**
 * The background worker owns the only Sentry client; other contexts forward
 * reports through the background service. Without `WXT_SENTRY_DSN` the build
 * keeps console logging and the SDK is tree-shaken out.
 */
export function createErrorSink(): ErrorSink {
	const dsn = import.meta.env.WXT_SENTRY_DSN
	if (!dsn) {
		return (error, context) => console.error(`[${context}]`, error)
	}

	// Sentry.init() installs global state that a host page's own Sentry can
	// read. Shared-environment guidance: a private client, no global
	// integrations. https://docs.sentry.io/platforms/javascript/best-practices/shared-environments/
	const client = new BrowserClient({
		dsn,
		environment: import.meta.env.MODE,
		release: browser.runtime.getManifest().version,
		transport: makeFetchTransport,
		stackParser: defaultStackParser,
		integrations: getDefaultIntegrations({}).filter(
			(integration) => !GLOBAL_INTEGRATIONS.has(integration.name),
		),
	})
	const scope = new Scope()
	scope.setClient(client)
	client.init()

	return (error, context) => {
		scope.captureException(error, { captureContext: { tags: { context } } })
	}
}

export function captureReport(sink: ErrorSink, report: ErrorReport): void {
	const error = new Error(report.message)
	error.name = report.name
	error.stack = report.stack
	sink(error, report.context)
}

const GLOBAL_INTEGRATIONS = new Set([
	'BrowserApiErrors',
	'BrowserSession',
	'Breadcrumbs',
	'ConversationId',
	'GlobalHandlers',
	'FunctionToString',
])
