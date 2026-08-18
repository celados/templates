export type AnnotationTarget = {
	/**
	 * Normalized source location (`file:line:column`) when any dev tooling
	 * provides it.
	 */
	sourceLoc: string | null
	/** Stable CSS selector fallback (id > test hook > authored classes). */
	selector: string
	/** Human-readable summary, e.g. `button "Get started"`. */
	label: string
	/** Position within the artboard content box, 0–1 fractions. */
	relX: number
	relY: number
	/** Pin anchor in world coordinates; re-resolved on load when possible. */
	worldX: number
	worldY: number
}

export type Annotation = {
	id: string
	canvasId: string
	viewId: string
	comment: string
	createdAt: number
	target: AnnotationTarget
}

const storageKey = (canvasId: string) =>
	`design-canvas:annotations:v1:${canvasId}`

export function loadAnnotations(canvasId: string): Annotation[] {
	try {
		const raw = localStorage.getItem(storageKey(canvasId))
		if (!raw) return []
		const parsed: unknown = JSON.parse(raw)
		if (!Array.isArray(parsed)) return []
		return parsed.filter(
			(entry): entry is Annotation =>
				typeof entry === 'object' &&
				entry !== null &&
				typeof (entry as Annotation).id === 'string' &&
				typeof (entry as Annotation).comment === 'string' &&
				typeof (entry as Annotation).target === 'object',
		)
	} catch {
		return []
	}
}

export function saveAnnotations(canvasId: string, annotations: Annotation[]) {
	try {
		localStorage.setItem(storageKey(canvasId), JSON.stringify(annotations))
	} catch {
		console.warn('[design] annotations could not be persisted (quota)')
	}
}
