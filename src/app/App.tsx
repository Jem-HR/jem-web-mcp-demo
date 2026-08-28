import "../styles.css";
import type React from "react";

export function App(): React.JSX.Element {
  return (
    <main className="shell">
      <section className="shell-card" aria-labelledby="app-title">
        <p className="eyebrow">WebMCP foundation</p>
        <h1 id="app-title">Jem WebMCP Demo</h1>
        <p>Ready for the Figma handoff.</p>
      </section>
    </main>
  );
}
