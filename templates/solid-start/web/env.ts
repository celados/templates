import * as v from 'valibot'

export default {
	client: {
		// Optional so checks and SSR builds do not require a selected Convex
		// deployment. `bun run dev` writes both values to .env.local.
		VITE_CONVEX_URL: v.optional(v.pipe(v.string(), v.minLength(1))),
		VITE_CONVEX_SITE_URL: v.optional(v.pipe(v.string(), v.minLength(1))),
	},
}
