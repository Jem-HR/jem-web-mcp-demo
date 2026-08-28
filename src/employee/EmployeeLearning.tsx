import { Card } from "../components/Card";
import { StatusBadge } from "../components/StatusBadge";
import { useDemoSelector } from "../demo/DemoProvider";
import { formatEmployeeCurrency, formatEmployeeDate } from "./employee-display";

export function EmployeeLearning() {
  const learning = useDemoSelector((state) => state.employee.learning);

  return (
    <div className="employee-panel">
      <header className="employee-panel__header">
        <h2>Learn</h2>
        <p>Short lessons with clear benefits and no surprise commitments.</p>
      </header>
      <div className="employee-card-grid">
        {learning.map((item) => (
          <Card className="employee-card" key={item.id}>
            <div className="employee-card__heading-row">
              <div>
                <p className="eyebrow">{item.category}</p>
                <h3>{item.title}</h3>
              </div>
              <StatusBadge tone={item.completed ? "success" : "info"}>
                {item.completed ? "Completed" : "Available"}
              </StatusBadge>
            </div>
            <p>{item.description}</p>
            <dl className="employee-details">
              <div>
                <dt>Duration</dt>
                <dd>{item.durationMinutes} minutes</dd>
              </div>
              <div>
                <dt>Benefit</dt>
                <dd>
                  {formatEmployeeCurrency(item.rewardAmount)} {item.rewardType}
                </dd>
              </div>
              <div>
                <dt>Expires</dt>
                <dd>{formatEmployeeDate(item.expiresOn)}</dd>
              </div>
            </dl>
          </Card>
        ))}
      </div>
    </div>
  );
}
