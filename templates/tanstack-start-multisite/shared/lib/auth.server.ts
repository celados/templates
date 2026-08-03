import { convexBetterAuthReactStart } from '@convex-dev/better-auth/react-start'

function requirePublicEnvironment(name: string, value: string | undefined) {
	if (!value) {
		throw new Error(`${name} is not configured`)
	}
	return value
}

export const { getToken, handler } = convexBetterAuthReactStart({
	// These URLs are public build inputs. Static Vite replacement avoids reading
	// process.env before the Workers request environment exists.
	// Source: https://vite.dev/guide/env-and-mode
	convexUrl: requirePublicEnvironment(
		'VITE_CONVEX_URL',
		import.meta.env.VITE_CONVEX_URL,
	),
	convexSiteUrl: requirePublicEnvironment(
		'VITE_CONVEX_SITE_URL',
		import.meta.env.VITE_CONVEX_SITE_URL,
	),
})
