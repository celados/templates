import { Loading } from 'solid-js'

import { createCounter } from './use-counter'

import './counter-panel.css'

export function CounterPanel(props: { title: string; description: string }) {
	const counter = createCounter()
	return (
		<section class="counter-panel" data-testid="counter-panel">
			<div class="copy">
				<p class="eyebrow">Solid 2 · MV3</p>
				<h1>{props.title}</h1>
				<p class="description">{props.description}</p>
			</div>
			<div class="metric">
				<span>Persistent count</span>
				<Loading fallback={<output>…</output>}>
					<output data-testid="counter-value" aria-live="polite">
						{counter.count$()}
					</output>
				</Loading>
			</div>
			<div class="actions">
				<button
					type="button"
					disabled={counter.pending()}
					data-testid="increment"
					onClick={() => void counter.increment()}
				>
					Increment
				</button>
				<button
					type="button"
					class="secondary"
					disabled={counter.pending()}
					data-testid="reset"
					onClick={() => void counter.reset()}
				>
					Reset
				</button>
			</div>
		</section>
	)
}
