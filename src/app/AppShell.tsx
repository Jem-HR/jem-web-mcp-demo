import { useDemoSelector } from "../demo/DemoProvider";
import { EmployeeExperience } from "../employee/EmployeeExperience";
import { EmployerExperience } from "../employer/EmployerExperience";
import { useWebMcpStatus } from "../webmcp/use-webmcp-status";
import { OnboardingFlow } from "../onboarding/OnboardingFlow";
import { AppHeader } from "./AppHeader";

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
        <EmployerExperience />
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
