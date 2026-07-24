import { CounterCard } from '@app/ui'

export function App() {
  return <main class="app-shell">
    <header class="hero">
      <p class="eyebrow">Ripple TS workspace</p>
      <h1>Small app, explicit package boundaries.</h1>
      <p class="lede">
        Build the product in <code>apps/web</code> and move reusable TSRX components into
        <code>packages/ui</code>.
      </p>
    </header>

    <CounterCard label="Package-owned counter" initialCount={1} />

    <footer>
      <a href="https://www.ripple-ts.com/docs" target="_blank">Read the Ripple docs</a>
    </footer>
  </main>
}
