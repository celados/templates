type MagicLinkEmail = {
	email: string
	url: string
}

export async function sendMagicLinkEmail(input: MagicLinkEmail) {
	const apiKey = requireEnvironment('RESEND_API_KEY')
	const from = requireEnvironment('AUTH_EMAIL_FROM')
	const escapedUrl = escapeHtml(input.url)

	// One HTTP call keeps the email boundary smaller than a provider SDK.
	// Source: https://resend.com/docs/api-reference/emails/send-email
	const response = await fetch('https://api.resend.com/emails', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${apiKey}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			from,
			to: [input.email],
			subject: 'Your sign-in link',
			text: `Sign in to your account:\n\n${input.url}\n\nThis link expires in 5 minutes and can only be used once.`,
			html: [
				'<p>Sign in to your account:</p>',
				`<p><a href="${escapedUrl}">Sign in</a></p>`,
				'<p>This link expires in 5 minutes and can only be used once.</p>',
			].join(''),
		}),
	})

	if (!response.ok) {
		// Do not include the response body: providers may echo recipient data.
		throw new Error(`Resend rejected the email with status ${response.status}`)
	}
}

function escapeHtml(value: string) {
	return value
		.replaceAll('&', '&amp;')
		.replaceAll('"', '&quot;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
}

function requireEnvironment(name: string) {
	const value = process.env[name]
	if (!value) {
		throw new Error(`${name} is required`)
	}
	return value
}
