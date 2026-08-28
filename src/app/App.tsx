import { useWebMcpStatus } from "../webmcp/use-webmcp-status";
import type { WebMcpStatus } from "../webmcp/types";
import { getAppStatus } from "./app-status";

function getStatusCopy(status: WebMcpStatus): string {
  switch (status.state) {
    case "registering":
      return "Registering WebMCP tools…";
    case "ready":
      return `WebMCP is ready with ${status.toolCount} tool${status.toolCount === 1 ? "" : "s"}.`;
    case "unsupported":
      return "WebMCP is unavailable in this browser.";
    case "error":
      return status.message;
  }
}

export function App() {
  const appStatus = getAppStatus();
  const webMcpStatus = useWebMcpStatus();

  return (
    <main className="app-shell">
      <section className="app-card" aria-labelledby="app-title">
        <p className="eyebrow">{appStatus.phase} · OpenAI WebMCP Challenge</p>
        <h1 id="app-title">{appStatus.name}</h1>
        <p className="lede">Ready for the Figma handoff.</p>

        <div
          className={`status-panel status-panel--${webMcpStatus.state}`}
          role="status"
          aria-live="polite"
        >
          <span className="status-dot" aria-hidden="true" />
          <span>{getStatusCopy(webMcpStatus)}</span>
        </div>

        <p className="testing-note">
          Test site tools in ChatGPT’s in-app browser or Chrome with WebMCP
          testing enabled.
        </p>
      </section>
    </main>
  );
}
