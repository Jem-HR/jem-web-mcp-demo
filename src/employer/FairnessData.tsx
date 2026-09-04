import { Card } from "../components/Card";
import { StatusBadge } from "../components/StatusBadge";
import { useDemoCapabilities } from "../demo/DemoProvider";

function label(value: string): string {
  return value
    .split("_")
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

export function FairnessData() {
  const employer = useDemoCapabilities().employer;
  const dashboardResult = employer.getDashboard();
  const exceptionsResult = employer.listFairnessExceptions();

  if (!dashboardResult.ok || !exceptionsResult.ok) {
    const recovery = !dashboardResult.ok
      ? dashboardResult.error.recovery
      : exceptionsResult.ok
        ? "Refresh fairness data."
        : exceptionsResult.error.recovery;
    return (
      <p className="recovery-message" role="alert">
        We couldn’t load fairness data. {recovery}
      </p>
    );
  }

  return (
    <div className="employer-panel">
      <header className="employer-panel__header">
        <h2>Fairness and data</h2>
        <p>Review anonymised exceptions before any programme can move on.</p>
      </header>
      <section aria-labelledby="exceptions-title">
        <h3 id="exceptions-title">Anonymised data exceptions</h3>
        <div className="employer-card-grid">
          {exceptionsResult.data.map((exception) => (
            <Card className="employer-card" key={exception.id}>
              <div className="employer-card__heading-row">
                <div>
                  <p className="eyebrow">{exception.employeeLabel}</p>
                  <h3>{exception.issue}</h3>
                </div>
                <StatusBadge
                  tone={exception.severity === "medium" ? "warning" : "neutral"}
                >
                  {label(exception.severity)} · {label(exception.reviewState)}
                </StatusBadge>
              </div>
              <p>{exception.programmeName}</p>
              <p className="employer-card__muted">
                Source record refreshed {exception.recordFreshnessHours} hours
                ago
              </p>
            </Card>
          ))}
        </div>
      </section>
      <Card as="section" className="employer-card employer-rules">
        <h3>Fairness rules</h3>
        <ul>
          {dashboardResult.data.fairnessRules.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
