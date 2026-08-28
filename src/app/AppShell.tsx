import { Card } from "../components/Card";
import { ProgressRing } from "../components/ProgressRing";
import { formatCurrency } from "../components/format";
import { useDemoSelector } from "../demo/DemoProvider";
import { selectEmployeeDashboard } from "../demo/selectors";
import { EmployeeExperience } from "../employee/EmployeeExperience";
import { useWebMcpStatus } from "../webmcp/use-webmcp-status";
import { OnboardingFlow } from "../onboarding/OnboardingFlow";
import { AppHeader } from "./AppHeader";

function CompactDashboardPlaceholder() {
  const dashboard = useDemoSelector(selectEmployeeDashboard);
  const firstName =
    dashboard.employeeName.split(" ")[0] ?? dashboard.employeeName;

  return (
    <main
      aria-labelledby="employee-summary-title"
      className="app-shell__content"
    >
      <div className="app-shell__intro">
        <p className="eyebrow">Your money, your goals</p>
        <h1 id="employee-summary-title">Hey {firstName}</h1>
        <p>Here’s your savings progress today.</p>
      </div>
      <Card className="goal-summary">
        <div>
          <p className="eyebrow">Savings goal</p>
          <h2>{dashboard.goal.name}</h2>
          <p className="goal-summary__amount">
            {formatCurrency(dashboard.goalProgress.saved)} saved of{" "}
            {formatCurrency(dashboard.goalProgress.target)}
          </p>
        </div>
        <ProgressRing
          label="Savings progress"
          percentage={dashboard.goalProgress.percentage}
        />
      </Card>
    </main>
  );
}

export function AppShell() {
  const webMcpStatus = useWebMcpStatus();
  const activity = useDemoSelector((state) => state.activity?.message ?? "");
  const mode = useDemoSelector((state) => state.mode);
  const onboardingComplete = useDemoSelector(
    (state) => state.onboarding.completed,
  );

  return (
    <div className="app-shell">
      <AppHeader webMcpStatus={webMcpStatus} />
      {!onboardingComplete ? (
        <OnboardingFlow />
      ) : mode === "employee" ? (
        <EmployeeExperience />
      ) : (
        <CompactDashboardPlaceholder />
      )}
      <div
        aria-label="Latest activity"
        aria-live="polite"
        className="visually-hidden"
        role="status"
      >
        {activity}
      </div>
    </div>
  );
}
