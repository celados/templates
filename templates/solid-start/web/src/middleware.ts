import { createAPIHandler } from 'filesystem-routing/api'
import routes from 'virtual:file-routes'

// Uppercase exports in routes/api/** answer requests; everything else falls
// through to page rendering.
export default [createAPIHandler(routes)]
