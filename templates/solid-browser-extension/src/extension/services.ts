import type { ProxyServiceKey } from '@webext-core/proxy-service'

import type { BackgroundService } from './background-service'

// Type-only import: UI roots must not bundle the background implementation.
export const BACKGROUND_SERVICE_KEY =
	'background' as ProxyServiceKey<BackgroundService>
