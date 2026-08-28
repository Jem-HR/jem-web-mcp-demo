import { Card } from "../components/Card";
import { StatusBadge } from "../components/StatusBadge";
import { formatCurrency, formatDate } from "../components/format";
import { useDemoCapabilities } from "../demo/DemoProvider";
import type { EmployerShiftSummary } from "../demo/employer-capabilities";

function estimateLabel(shift: EmployerShiftSummary): string {
  return shift.estimateKind === "confirmed_before_deductions"
    ? "confirmed before deductions"
    : "estimated before deductions";
}

function statusLabel(status: EmployerShiftSummary["status"]): string {
  return `${status.charAt(0).toUpperCase()}${status.slice(1)}`;
}

export function EmployerShifts() {
  const result = useDemoCapabilities().employer.listOpenShifts();

  if (!result.ok) {
    return (
      <p className="recovery-message" role="alert">
        We couldn’t load open shifts. {result.error.recovery}
      </p>
    );
  }

  return (
    <div className="employer-panel">
      <header className="employer-panel__header">
        <h2>Open shifts</h2>
        <p>
          Monitor applications and places. Employee requests stay unchanged.
        </p>
      </header>
      <div className="employer-card-grid">
        {result.data.map((shift) => (
          <Card className="employer-card" key={shift.id}>
            <div className="employer-card__heading-row">
              <div>
                <p className="eyebrow">{formatDate(shift.date)}</p>
                <h3>
                  {shift.role} · {shift.site}
                </h3>
              </div>
              <StatusBadge
                tone={shift.status === "requested" ? "warning" : "info"}
              >
                {statusLabel(shift.status)}
              </StatusBadge>
            </div>
            <p>
              {shift.startTime}–{shift.endTime}
            </p>
            <dl className="employer-details">
              <div>
                <dt>Applications</dt>
                <dd>
                  {shift.applications} applications · {shift.spots}{" "}
                  {shift.spots === 1 ? "place" : "places"}
                </dd>
              </div>
              <div>
                <dt>Deadline</dt>
                <dd>
                  {shift.deadline ? formatDate(shift.deadline) : "No deadline"}
                </dd>
              </div>
              <div>
                <dt>Earnings</dt>
                <dd>
                  {formatCurrency(shift.estimatedEarnings)}{" "}
                  {estimateLabel(shift)}
                </dd>
              </div>
            </dl>
          </Card>
        ))}
      </div>
    </div>
  );
}
