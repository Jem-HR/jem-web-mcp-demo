import { useState } from "react";

import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { ProgressRing } from "../components/ProgressRing";
import { StatusBadge } from "../components/StatusBadge";
import { useDemoSelector, useDemoStore } from "../demo/DemoProvider";
import { selectEmployeeDashboard } from "../demo/selectors";
import { GoalEditorDialog } from "./GoalEditorDialog";
import {
  estimateLabel,
  formatEmployeeCurrency,
  formatEmployeeDate,
  shiftDuration,
} from "./employee-display";

export function EmployeeOverview() {
  const [editorOpen, setEditorOpen] = useState(false);
  const dashboard = useDemoSelector(selectEmployeeDashboard);
  const activity = useDemoSelector((state) => state.activity);
  const nextShift = useDemoSelector((state) =>
    dashboard.nextAction === null
      ? null
      : (state.employee.shifts.find(
          (shift) => shift.id === dashboard.nextAction?.id,
        ) ?? null),
  );
  const store = useDemoStore();

  return (
    <div className="employee-overview">
      <Card className="employee-card employee-card--goal">
        <div>
          <p className="eyebrow">Your goal</p>
          <h2>{dashboard.goal.name}</h2>
          <p className="employee-card__lead">
            <span aria-hidden="true">{dashboard.goal.emoji}</span>{" "}
            {formatEmployeeCurrency(dashboard.goalProgress.saved)} saved of{" "}
            {formatEmployeeCurrency(dashboard.goalProgress.target)}
          </p>
          <p>{dashboard.goalProgress.percentage}% complete</p>
          <p className="employee-card__muted">
            {formatEmployeeCurrency(dashboard.goalProgress.remaining)} to go ·{" "}
            {dashboard.goalProgress.monthsRemaining} months at your current plan
          </p>
          <Button onClick={() => setEditorOpen(true)} variant="secondary">
            Edit goal and expenses
          </Button>
        </div>
        <ProgressRing
          label="Savings progress"
          percentage={dashboard.goalProgress.percentage}
          showPercentage={false}
        />
      </Card>

      <section aria-label="Pay and shifts" className="employee-summary-grid">
        <Card className="employee-card">
          <p className="eyebrow">Next payday</p>
          <h2>{formatEmployeeDate(dashboard.nextPayday)}</h2>
          <p>{dashboard.daysToPayday} days to payday</p>
        </Card>
        <Card className="employee-card">
          <p className="eyebrow">Expected earnings</p>
          <h2>{formatEmployeeCurrency(dashboard.expectedEarnings)}</h2>
          <p>{dashboard.hoursWorked} hours recorded</p>
        </Card>
        <Card className="employee-card">
          <p className="eyebrow">Confirmed shifts</p>
          <h2>{dashboard.confirmedShiftCount}</h2>
          <p>
            {dashboard.requestedShiftCount} requested ·{" "}
            {dashboard.availableShiftCount} available
          </p>
        </Card>
      </section>

      {nextShift ? (
        <Card className="employee-card employee-card--action">
          <div className="employee-card__heading-row">
            <div>
              <p className="eyebrow">Best next action</p>
              <h2>
                {nextShift.role} at {nextShift.site}
              </h2>
            </div>
            <StatusBadge tone="info">Available</StatusBadge>
          </div>
          <p>{formatEmployeeDate(nextShift.date)}</p>
          <dl className="employee-details">
            <div>
              <dt>Benefit</dt>
              <dd>
                {formatEmployeeCurrency(nextShift.estimatedEarnings)}{" "}
                {estimateLabel(nextShift)}
              </dd>
            </div>
            <div>
              <dt>Effort</dt>
              <dd>{shiftDuration(nextShift)}</dd>
            </div>
            <div>
              <dt>Eligibility</dt>
              <dd>{nextShift.eligibility}</dd>
            </div>
            <div>
              <dt>Expires</dt>
              <dd>
                {nextShift.deadline
                  ? formatEmployeeDate(nextShift.deadline)
                  : "No deadline"}
              </dd>
            </div>
          </dl>
          <Button
            onClick={() =>
              store.dispatch({
                type: "navigation/set-employee-tab",
                tab: "shifts",
              })
            }
          >
            View shift
          </Button>
        </Card>
      ) : null}

      <section
        aria-label="Learning and rewards"
        className="employee-summary-grid"
      >
        <Card className="employee-card">
          <p className="eyebrow">Learning</p>
          <h2>
            {dashboard.learningSummary.completed} of{" "}
            {dashboard.learningSummary.total} learning items
          </h2>
          <p>Build skills at your own pace.</p>
        </Card>
        <Card className="employee-card">
          <p className="eyebrow">Rewards</p>
          <h2>
            {dashboard.rewardSummary.earned} earned ·{" "}
            {dashboard.rewardSummary.allocated} allocated
          </h2>
          <p>{dashboard.rewardSummary.total} reward opportunities tracked.</p>
        </Card>
        <Card className="employee-card">
          <p className="eyebrow">Recent activity</p>
          <h2>{activity?.message ?? "No recent changes"}</h2>
          <p>
            {activity
              ? `Recorded from ${activity.source === "ui" ? "this app" : "WebMCP"}.`
              : "Your confirmed actions will appear here."}
          </p>
        </Card>
      </section>

      <GoalEditorDialog
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
      />
    </div>
  );
}
