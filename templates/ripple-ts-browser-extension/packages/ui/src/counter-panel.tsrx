export type CounterPanelProps = Readonly<{
	count: number
	description: string
	disabled?: boolean
	onIncrement: () => void
	onReset?: () => void
	title: string
}>

export function CounterPanel(&{
	count,
	description,
	disabled = false,
	onIncrement,
	onReset,
	title,
}: CounterPanelProps) @{
	<section class="counter-panel" data-testid="counter-panel">
		<div class="copy">
			<p class="eyebrow">Ripple TS · MV3</p>
			<h1>{title}</h1>
			<p class="description">{description}</p>
		</div>

		<div class="metric">
			<span>Persistent count</span>
			<output data-testid="counter-value" aria-live="polite">{count}</output>
		</div>

		<div class="actions">
			<button
				type="button"
				disabled={disabled}
				data-testid="increment"
				onClick={onIncrement}
			>
				Increment
			</button>
			@if (onReset) {
				<button
					type="button"
					class="secondary"
					disabled={disabled}
					data-testid="reset"
					onClick={onReset}
				>
					Reset
				</button>
			}
		</div>

		<style>
			.counter-panel {
				box-sizing: border-box;
				display: grid;
				gap: 20px;
				width: 100%;
				padding: 22px;
				border: 1px solid rgb(255 255 255 / 12%);
				border-radius: 22px;
				color: #eef0f8;
				background:
					radial-gradient(circle at 10% 0%, rgb(139 124 255 / 24%), transparent 220px),
					#121620;
				box-shadow: 0 24px 80px rgb(0 0 0 / 30%);
				font-family:
					Inter,
					ui-sans-serif,
					system-ui,
					-apple-system,
					BlinkMacSystemFont,
					sans-serif;
			}

			.copy {
				display: grid;
				gap: 8px;
			}

			.eyebrow,
			h1,
			.description {
				margin: 0;
			}

			.eyebrow {
				color: #a99cff;
				font-size: 11px;
				font-weight: 760;
				letter-spacing: 1.2px;
				text-transform: uppercase;
			}

			h1 {
				font-size: 24px;
				line-height: 1.05;
				letter-spacing: -0.7px;
			}

			.description {
				color: #aeb4c5;
				font-size: 13px;
				line-height: 1.55;
			}

			.metric {
				display: flex;
				align-items: center;
				justify-content: space-between;
				gap: 16px;
				padding: 14px 16px;
				border: 1px solid rgb(255 255 255 / 10%);
				border-radius: 14px;
				background: rgb(255 255 255 / 5%);
			}

			.metric span {
				color: #c6cad7;
				font-size: 12px;
			}

			output {
				font-size: 24px;
				font-variant-numeric: tabular-nums;
				font-weight: 780;
			}

			.actions {
				display: grid;
				grid-template-columns: 1fr auto;
				gap: 10px;
			}

			button {
				min-height: 40px;
				padding: 0 16px;
				border: 0;
				border-radius: 12px;
				color: #11131a;
				background: #a99cff;
				font: inherit;
				font-size: 13px;
				font-weight: 730;
				cursor: pointer;
			}

			button.secondary {
				border: 1px solid rgb(255 255 255 / 14%);
				color: #d8dbe5;
				background: rgb(255 255 255 / 6%);
			}

			button:hover:not(:disabled) {
				filter: brightness(1.08);
			}

			button:focus-visible {
				outline: 3px solid rgb(62 214 197 / 70%);
				outline-offset: 2px;
			}

			button:disabled {
				cursor: progress;
				opacity: 0.55;
			}
		</style>
	</section>
}
