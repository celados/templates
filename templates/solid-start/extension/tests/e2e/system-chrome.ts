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

	// Chrome terminates idle MV3 workers and disconnects their ports; the next
	// call must reconnect instead of failing on the dead port.
	const cdp = await context.newCDPSession(sidePanel)
	await cdp.send('ServiceWorker.enable')
	await cdp.send('ServiceWorker.stopAllWorkers')
	await waitForWorkerExit(browser, extensionId)
	// The side panel's port carried the reset above, so this call exercises
	// the reconnect path.
	await sidePanel.getByTestId('increment').click()
	await expectText(sidePanel.getByTestId('counter-value'), '1')
	await expectText(counter, '1')
	console.log(
		'Verified content UI, side panel, oRPC reconnect after worker shutdown, and persisted storage in system Chrome',
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
	// Chrome's own component extensions also run service workers; match the
	// worker WXT emits for this extension instead of the first one listed.
	const isOwnWorker = (url: string) =>
		url.startsWith('chrome-extension://') && url.endsWith('/background.js')
	const worker =
		context
			.serviceWorkers()
			.find((candidate) => isOwnWorker(candidate.url())) ??
		(await context.waitForEvent('serviceworker', {
			predicate: (candidate) => isOwnWorker(candidate.url()),
			timeout: 10_000,
		}))
	const [, , extensionId] = worker.url().split('/')

	if (!extensionId) {
		throw new Error('Could not derive the extension ID from its service worker')
	}

	return extensionId
}

async function waitForWorkerExit(
	connectedBrowser: Browser,
	extensionId: string,
): Promise<void> {
	// Playwright's serviceWorkers() list lags behind worker shutdown; ask CDP.
	const cdp = await connectedBrowser.newBrowserCDPSession()
	const url = `chrome-extension://${extensionId}/background.js`
	const deadline = Date.now() + 5_000

	while (
		(await cdp.send('Target.getTargets')).targetInfos.some(
			(target) => target.type === 'service_worker' && target.url === url,
		)
	) {
		if (Date.now() > deadline) {
			throw new Error('The extension service worker did not stop')
		}
		await new Promise((resolve) => setTimeout(resolve, 50))
	}
	await cdp.detach()
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
