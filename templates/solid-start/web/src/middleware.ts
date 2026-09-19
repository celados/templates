import { createAPIHandler } from 'filesystem-routing/api'
import routes from 'virtual:file-routes'

import { serverConvex } from './lib/convex-server'

// Uppercase exports in routes/api/** answer requests; everything else falls
// through to page rendering, which reads Convex through `locals.convex`.
export default [createAPIHandler(routes), serverConvex]
