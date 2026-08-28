import type React from "react";

export function App(): React.JSX.Element {
  return (
    <main className="app-shell">
      <section className="app-card" aria-labelledby="app-title">
        <p className="eyebrow">OpenAI WebMCP Challenge</p>
        <h1 id="app-title">Jem WebMCP Demo</h1>
        <p className="lede">Ready for the Figma handoff.</p>
      </section>
    </main>
  );
}
