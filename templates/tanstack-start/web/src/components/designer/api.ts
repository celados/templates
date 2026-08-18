import type { ReactNode } from 'react'

/** Named artboard widths; authoring sugar so pages read like design intent. */
export const viewport = {
	desktop: 1440,
	laptop: 1280,
	tablet: 834,
	mobile: 390,
} as const

export type ViewportName = keyof typeof viewport

export type DesignerPageVariant = {
	name: string
	label?: string
	width?: number
	minHeight?: number
	dark?: boolean
	component: ReactNode
}

export type DesignerPage = {
	/** Unique kebab-case id; becomes /_design/c/<name>. */
	name: string
	title?: string
	group?: string
	summary?: string
	tags?: string[]
	/** Single tree shown at desktop + mobile unless `variants` is set. */
	component?: ReactNode
	variants?: DesignerPageVariant[]
}

/** Normalized page used inside the designer runtime. */
export type CanvasView = {
	id: string
	label: string
	summary?: string
	width: number
	minHeight?: number
	dark?: boolean
	render: () => ReactNode
}

export type CanvasDefinition = {
	id: string
	title: string
	group: string
	summary?: string
	tags?: string[]
	views: CanvasView[]
}

export function resolveDesignerPages(
	pages: DesignerPage[],
): CanvasDefinition[] {
	return pages.map((page) => {
		const variants =
			page.variants && page.variants.length > 0
				? page.variants
				: page.component != null
					? [
							{
								name: 'desktop',
								label: 'Desktop',
								width: viewport.desktop,
								component: page.component,
							},
						]
					: []
		if (variants.length === 0) {
			throw new Error(
				`Designer page "${page.name}" needs component or variants`,
			)
		}
		return {
			id: page.name,
			title: page.title ?? page.name,
			group: page.group ?? 'Pages',
			summary: page.summary,
			tags: page.tags,
			views: variants.map((variant) => ({
				id: variant.name,
				label: variant.label ?? variant.name,
				width: variant.width ?? viewport.desktop,
				minHeight: variant.minHeight,
				dark: variant.dark,
				render: () => variant.component,
			})),
		}
	})
}
