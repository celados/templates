import { track } from 'ripple'

export type CounterCardProps = Readonly<{
  initialCount?: number
  label: string
}>

export function CounterCard(props: CounterCardProps) @{
  const { initialCount = 0, label } = props
  let &[count] = track(initialCount)

  <section class="counter-card">
    <p>{label}</p>
    <div class="counter-controls">
      <button type="button" aria-label="Decrease count" onClick={() => count--}>−</button>
      <output aria-live="polite">{count}</output>
      <button type="button" aria-label="Increase count" onClick={() => count++}>+</button>
    </div>

    <style>
      .counter-card {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1.5rem;
        padding: 1.25rem;
        border: 1px solid rgb(255 255 255 / 12%);
        border-radius: 1rem;
        background: rgb(255 255 255 / 6%);
        box-shadow: 0 1.5rem 4rem rgb(0 0 0 / 24%);
      }

      .counter-card p {
        margin: 0;
        font-weight: 650;
      }

      .counter-controls {
        display: grid;
        grid-template-columns: 2.5rem 3rem 2.5rem;
        align-items: center;
        text-align: center;
      }

      button {
        width: 2.5rem;
        height: 2.5rem;
        border: 1px solid rgb(255 255 255 / 15%);
        border-radius: 0.65rem;
        color: inherit;
        background: rgb(255 255 255 / 8%);
        cursor: pointer;
      }

      button:hover {
        background: rgb(255 255 255 / 14%);
      }

      button:focus-visible {
        outline: 0.15rem solid #aa9cff;
        outline-offset: 0.15rem;
      }

      output {
        font-variant-numeric: tabular-nums;
        font-weight: 750;
      }

      @media (max-width: 34rem) {
        .counter-card {
          align-items: flex-start;
          flex-direction: column;
        }
      }
    </style>
  </section>
}
