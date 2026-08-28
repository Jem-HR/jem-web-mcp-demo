import { Button } from "../components/Button";
import { useDemoSelector, useDemoStore } from "../demo/DemoProvider";
import type { WebMcpStatus } from "../webmcp/types";

export interface AppHeaderProps {
  webMcpStatus: WebMcpStatus;
}

function statusLabel(status: WebMcpStatus): string {
  switch (status.state) {
    case "registering":
      return "WebMCP is connecting";
    case "ready":
      return "WebMCP is ready";
    case "unsupported":
      return "WebMCP is unavailable";
    case "error":
      return "WebMCP needs attention";
  }
}

export function AppHeader({ webMcpStatus }: AppHeaderProps) {
  const store = useDemoStore();
  const { mode, persona } = useDemoSelector((state) => ({
    mode: state.mode,
    persona:
      state.mode === "employee"
        ? state.employee.profile.fullName
        : state.employer.profile.contactName,
  }));

  return (
    <header className="app-header">
      <div className="app-header__brand">
        <span aria-label="Jem" className="jem-mark">
          jem
        </span>
        <span className="app-header__name">Jem Unlocked</span>
      </div>
      <nav aria-label="Workspace mode" className="app-header__mode-switcher">
        <Button
          aria-pressed={mode === "employee"}
          onClick={() =>
            store.dispatch({ type: "navigation/set-mode", mode: "employee" })
          }
          variant={mode === "employee" ? "navy" : "ghost"}
        >
          Employee
        </Button>
        <Button
          aria-pressed={mode === "employer"}
          onClick={() =>
            store.dispatch({ type: "navigation/set-mode", mode: "employer" })
          }
          variant={mode === "employer" ? "navy" : "ghost"}
        >
          Employer Hub
        </Button>
      </nav>
      <div className="app-header__meta">
        <span>{persona}</span>
        <span
          className={`app-header__readiness app-header__readiness--${webMcpStatus.state}`}
        >
          {statusLabel(webMcpStatus)}
        </span>
        <Button
          onClick={() => store.dispatch({ type: "demo/reset" })}
          variant="secondary"
        >
          Reset demo
        </Button>
      </div>
    </header>
  );
}
