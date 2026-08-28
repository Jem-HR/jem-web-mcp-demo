import { Card } from "../components/Card";
import { StatusBadge, type StatusTone } from "../components/StatusBadge";
import {
  formatCurrency,
  formatDate,
  formatPercentage,
} from "../components/format";
import { useDemoCapabilities } from "../demo/DemoProvider";
import type { ProgrammeSummary } from "../demo/employer-capabilities";

function programmeTone(programme: ProgrammeSummary): StatusTone {
  if (programme.status === "draft") return "neutral";
  return programme.readiness === "ready" ? "success" : "warning";
}

function statusLabel(value: string): string {
  return value
    .split("_")
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

export function EmployerDashboard() {
  const { employer } = useDemoCapabilities();
  const dashboardResult = employer.getDashboard();
  const programmesResult = employer.listProgrammes();
  const exceptionsResult = employer.listFairnessExceptions();

  if (!dashboardResult.ok || !programmesResult.ok || !exceptionsResult.ok) {
    const recovery = !dashboardResult.ok
      ? dashboardResult.error.recovery
      : !programmesResult.ok
        ? programmesResult.error.recovery
        : !exceptionsResult.ok
          ? exceptionsResult.error.recovery
          : "Refresh the dashboard.";
    return (
      <p className="recovery-message" role="alert">
        We couldn’t load the employer dashboard. {recovery}
      </p>
    );
  }

  const dashboard = dashboardResult.data;
  const exceptionCount = exceptionsResult.data.length;
  const budgetUsage =
    dashboard.totalProgrammeBudget === 0
      ? 0
      : Math.round(
          (dashboard.programmeSpend / dashboard.totalProgrammeBudget) * 100,
        );

  return (
    <div className="employer-panel employer-dashboard">
      <section aria-label="Workforce metrics" className="employer-metric-grid">
        <Card className="employer-card employer-metric">
          <p className="eyebrow">Total employees</p>
          <h2>{dashboard.totalEmployees}</h2>
          <p>
            <strong>{dashboard.activeEmployees}</strong> active employees
          </p>
        </Card>
        <Card className="employer-card employer-metric">
          <p className="eyebrow">Active programmes</p>
          <h2>{dashboard.activeProgrammeCount}</h2>
          <p>{dashboard.programmeCount} programmes in total</p>
        </Card>
        <Card className="employer-card employer-metric">
          <p className="eyebrow">Goal engagement</p>
          <h2>{formatPercentage(dashboard.goalEngagementPercent)}</h2>
          <p>{dashboard.dataConfidencePercent}% data confidence</p>
        </Card>
        <Card className="employer-card employer-metric">
          <p className="eyebrow">Budget usage</p>
          <h2>{formatPercentage(budgetUsage)}</h2>
          <p>
            {formatCurrency(dashboard.programmeSpend)} of{" "}
            {formatCurrency(dashboard.totalProgrammeBudget)}
          </p>
        </Card>
        <Card className="employer-card employer-metric">
          <p className="eyebrow">Open shift operations</p>
          <h2>{dashboard.openShiftCount}</h2>
          <p>{dashboard.requestedShiftCount} requested shifts</p>
        </Card>
        <Card className="employer-card employer-metric">
          <p className="eyebrow">Data exceptions</p>
          <h2>{dashboard.fairnessExceptionCount}</h2>
          <p>Anonymised records need review</p>
        </Card>
      </section>

      <section
        className="employer-section"
        aria-labelledby="dashboard-exceptions-title"
      >
        <header className="employer-panel__header">
          <h2 id="dashboard-exceptions-title">Data exceptions</h2>
          <p>
            {exceptionCount} anonymised{" "}
            {exceptionCount === 1 ? "record needs" : "records need"} review.
          </p>
        </header>
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
                  {statusLabel(exception.severity)}
                </StatusBadge>
              </div>
              <p>{exception.programmeName}</p>
              <p className="employer-card__muted">
                {exception.recordFreshnessHours} hours old ·{" "}
                {statusLabel(exception.reviewState)}
              </p>
            </Card>
          ))}
        </div>
      </section>

      <section className="employer-section" aria-labelledby="programmes-title">
        <header className="employer-panel__header">
          <h2 id="programmes-title">Programmes</h2>
          <p>Readiness, participation and budget at a glance.</p>
        </header>
        <div className="employer-card-grid">
          {programmesResult.data.map((programme) => (
            <Card className="employer-card" key={programme.id}>
              <div className="employer-card__heading-row">
                <div>
                  <p className="eyebrow">{statusLabel(programme.type)}</p>
                  <h3>{programme.name}</h3>
                </div>
                <StatusBadge tone={programmeTone(programme)}>
                  {statusLabel(programme.status)} ·{" "}
                  {statusLabel(programme.readiness)}
                </StatusBadge>
              </div>
              <dl className="employer-details">
                <div>
                  <dt>Enrolment</dt>
                  <dd>{programme.enrolled}</dd>
                </div>
                <div>
                  <dt>Participation</dt>
                  <dd>
                    {programme.participating} ·{" "}
                    {formatPercentage(programme.participationPercent)}
                  </dd>
                </div>
                <div>
                  <dt>Budget</dt>
                  <dd>{formatCurrency(programme.budget)}</dd>
                </div>
                <div>
                  <dt>Remaining</dt>
                  <dd>{formatCurrency(programme.remaining)}</dd>
                </div>
                <div>
                  <dt>Expiry</dt>
                  <dd>
                    {programme.expiresOn
                      ? formatDate(programme.expiresOn)
                      : "Not scheduled"}
                  </dd>
                </div>
              </dl>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
