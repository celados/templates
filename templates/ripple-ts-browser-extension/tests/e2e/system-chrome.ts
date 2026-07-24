import {
	chromium,
	type Browser,
	type BrowserContext,
	type Locator,
} from '@playwright/test'

const endpoint =
	process.env.CHROME_CDP_ENDPOINT ??
	`http://127.0.0.1:${process.env.CHROME_CDP_PORT ?? '9222'}`
let browser: Browser | undefined

try {
	browser = await chromium.connectOverCDP(endpoint)
} catch (cause) {
	throw new Error(
		`System Chrome is not available at ${endpoint}. Run \`bun run build\`, then \`bun run chrome\`.`,
		{ cause },
	)
}

try {
	const context = getContext(browser)
	const page = await context.newPage()
	await page.goto('https://example.com')

	const counter = page.getByTestId('counter-value')
	await counter.waitFor()
	await page.getByTestId('reset').click()
	await expectText(counter, '0')
	await page.getByTestId('increment').click()
	await expectText(counter, '1')

	const extensionId = await findExtensionId(context)
	const sidePanel = await context.newPage()
	await sidePanel.goto(`chrome-extension://${extensionId}/sidepanel.html`)
	await expectText(sidePanel.getByTestId('counter-value'), '1')

	await sidePanel.getByTestId('reset').click()
	await expectText(counter, '0')
	console.log(
		'Verified content UI, side panel, typed messaging, and persisted storage in system Chrome',
	)
} finally {
	await browser.close()
}

function getContext(connectedBrowser: Browser): BrowserContext {
	const [context] = connectedBrowser.contexts()

	if (!context) {
		throw new Error('System Chrome did not expose a browser context')
	}

	return context
}

async function findExtensionId(context: BrowserContext): Promise<string> {
	const worker =
		context
			.serviceWorkers()
			.find((candidate) => candidate.url().startsWith('chrome-extension://')) ??
		(await context.waitForEvent('serviceworker', {
			predicate: (candidate) =>
				candidate.url().startsWith('chrome-extension://'),
			timeout: 10_000,
		}))
	const [, , extensionId] = worker.url().split('/')

	if (!extensionId) {
		throw new Error('Could not derive the extension ID from its service worker')
	}

	return extensionId
}

async function expectText(locator: Locator, expected: string): Promise<void> {
	await locator.waitFor()
	const deadline = Date.now() + 5_000

	while (Date.now() < deadline) {
		if ((await locator.textContent())?.trim() === expected) {
			return
		}
		await new Promise((resolve) => setTimeout(resolve, 50))
	}

	throw new Error(`Expected visible counter text to become ${expected}`)
}
