import { convexBetterAuthReactStart } from '@convex-dev/better-auth/react-start'

function requireServerEnvironment(name: string) {
	const value = process.env[name]
	if (!value) {
		throw new Error(`${name} is not configured`)
	}
	return value
}

export const { getToken, handler } = convexBetterAuthReactStart({
	convexUrl: requireServerEnvironment('VITE_CONVEX_URL'),
	convexSiteUrl: requireServerEnvironment('VITE_CONVEX_SITE_URL'),
})
