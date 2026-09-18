import { proxyConvexSite } from '../../../lib/convex-site-proxy'

// Better Auth lives on the Convex site; this same-origin proxy keeps cookies
// first-party and gives Google one callback host.
export const GET = (event: { request: Request }) =>
	proxyConvexSite(event.request)
export const POST = (event: { request: Request }) =>
	proxyConvexSite(event.request)
