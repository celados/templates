import type { AuthConfig } from 'convex/server'

import { getAuthConfigProvider } from '@convex-dev/better-auth/auth-config'

export default {
	// Undefined intentionally preserves the remote-JWKS fallback before setup.
	// Source: https://labs.convex.dev/better-auth/experimental
	providers: [getAuthConfigProvider({ jwks: process.env.JWKS })],
} satisfies AuthConfig
