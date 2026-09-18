import { mkdir } from 'node:fs/promises'
import { isAbsolute, resolve } from 'node:path'

const requestedOutput = process.argv[2] ?? '.output/chrome-mv3'
const cdpPort = process.env.CHROME_CDP_PORT ?? '9222'
const outputDirectory = isAbsolute(requestedOutput)
	? requestedOutput
	: resolve(process.cwd(), requestedOutput)
const cdpEndpoint = `http://127.0.0.1:${cdpPort}`
const manifest = Bun.file(resolve(outputDirectory, 'manifest.json'))

if (!(await manifest.exists())) {
	throw new Error(
		`Build output was not found at ${outputDirectory}. Run the matching build or dev command first.`,
	)
}

const profileDirectory = resolve(process.cwd(), '.chrome-profile')
await mkdir(profileDirectory, { recursive: true })

const chromeBinary = await findSystemChrome()

console.log(`Opening system Google Chrome with profile: ${profileDirectory}`)

const chrome = Bun.spawn({
	cmd: [
		chromeBinary,
		`--remote-debugging-port=${cdpPort}`,
		'--remote-allow-origins=*',
		`--user-data-dir=${profileDirectory}`,
		'--no-first-run',
		'--no-default-browser-check',
		'https://example.com',
	],
	stdout: 'inherit',
	stderr: 'inherit',
})

try {
	const webSocketDebuggerUrl = await waitForCdp(cdpEndpoint)
	// Chrome blocks command-line extension sideloading. Its CDP API preserves
	// system-Chrome coverage without downloading a separate browser binary.
	// https://chromedevtools.github.io/devtools-protocol/tot/Extensions/#method-loadUnpacked
	const extensionId = await loadUnpacked(webSocketDebuggerUrl, outputDirectory)
	console.log(
		`Loaded unpacked extension ${extensionId} from: ${outputDirectory}`,
	)
	console.log(`Chrome DevTools endpoint: ${cdpEndpoint}`)
} catch (error) {
	chrome.kill()
	throw error
}

process.exitCode = await chrome.exited

async function waitForCdp(endpoint: string): Promise<string> {
	const deadline = Date.now() + 10_000

	while (Date.now() < deadline) {
		try {
			const response = await fetch(`${endpoint}/json/version`)

			if (response.ok) {
				const metadata = (await response.json()) as {
					webSocketDebuggerUrl?: string
				}

				if (metadata.webSocketDebuggerUrl) {
					return metadata.webSocketDebuggerUrl
				}
			}
		} catch {
			// Chrome exposes CDP shortly after the application process starts.
		}

		await new Promise((resolveWait) => setTimeout(resolveWait, 50))
	}

	throw new Error(
		`System Chrome did not expose DevTools at ${endpoint}. Set CHROME_CDP_PORT to an unused port and retry.`,
	)
}

async function loadUnpacked(
	webSocketDebuggerUrl: string,
	path: string,
): Promise<string> {
	return await new Promise((resolveExtension, rejectExtension) => {
		const socket = new WebSocket(webSocketDebuggerUrl)
		const timeout = setTimeout(() => {
			socket.close()
			rejectExtension(
				new Error('Timed out while loading the unpacked extension through CDP'),
			)
		}, 10_000)

		function reject(error: unknown) {
			clearTimeout(timeout)
			socket.close()
			rejectExtension(error)
		}

		socket.addEventListener(
			'open',
			() => {
				socket.send(
					JSON.stringify({
						id: 1,
						method: 'Extensions.loadUnpacked',
						params: { path },
					}),
				)
			},
			{ once: true },
		)
		socket.addEventListener(
			'error',
			() =>
				reject(new Error('Could not connect to the Chrome DevTools socket')),
			{ once: true },
		)
		socket.addEventListener('message', (event) => {
			const response = JSON.parse(String(event.data)) as {
				error?: { message?: string }
				id?: number
				result?: { id?: string }
			}

			if (response.id !== 1) {
				return
			}

			if (response.error) {
				reject(
					new Error(
						response.error.message ?? 'Chrome rejected Extensions.loadUnpacked',
					),
				)
				return
			}

			if (!response.result?.id) {
				reject(new Error('Chrome did not return an extension ID'))
				return
			}

			clearTimeout(timeout)
			socket.close()
			resolveExtension(response.result.id)
		})
	})
}

async function findSystemChrome(): Promise<string> {
	const candidates = [
		'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
		'/usr/bin/google-chrome',
		'/usr/bin/google-chrome-stable',
		process.env.PROGRAMFILES
			? resolve(
					process.env.PROGRAMFILES,
					'Google/Chrome/Application/chrome.exe',
				)
			: '',
	].filter(Boolean)

	for (const candidate of candidates) {
		if (await Bun.file(candidate).exists()) {
			return candidate
		}
	}

	throw new Error(
		'System Google Chrome was not found. This template does not download a fallback browser.',
	)
}
