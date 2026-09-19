import { Loading } from 'solid-js'

import { i18n } from '#i18n'

import { createCounter } from './use-counter'

import './counter-panel.css'

export function CounterPanel(props: { title: string; description: string }) {
	const counter = createCounter()
	return (
		<section class="counter-panel" data-testid="counter-panel">
			<div class="copy">
				<p class="eyebrow">{i18n.t('counter.eyebrow')}</p>
				<h1>{props.title}</h1>
				<p class="description">{props.description}</p>
			</div>
			<div class="metric">
				<span>{i18n.t('counter.label')}</span>
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
					{i18n.t('counter.increment')}
				</button>
				<button
					type="button"
					class="secondary"
					disabled={counter.pending()}
					data-testid="reset"
					onClick={() => void counter.reset()}
				>
					{i18n.t('counter.reset')}
				</button>
			</div>
		</section>
	)
}
