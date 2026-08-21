declare const __CONTENT_BUILD_DATE__: string

declare module '*.md' {
	import type { ComponentType } from 'react'

	import type { PostFrontmatter } from './content/post-schema'

	export const frontmatter: PostFrontmatter
	const Content: ComponentType
	export default Content
}

declare module '*.mdx' {
	import type { ComponentType } from 'react'

	import type { PostFrontmatter } from './content/post-schema'

	export const frontmatter: PostFrontmatter
	const Content: ComponentType
	export default Content
}

declare module '*&as=metadata' {
	const metadata: { height: number; src: string; width: number }
	export default metadata
}

declare module '*&as=srcset' {
	const srcset: string
	export default srcset
}
