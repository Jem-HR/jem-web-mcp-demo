import { useMemo } from "react";

import { useDemoCapabilities, useDemoSelector } from "../demo/DemoProvider";
import { EmployeeExperience } from "../employee/EmployeeExperience";
import { EmployerExperience } from "../employer/EmployerExperience";
import { createExposedWebMcpTools } from "../webmcp/tools";
import { useWebMcpStatus } from "../webmcp/use-webmcp-status";
import { OnboardingFlow } from "../onboarding/OnboardingFlow";
import { AppHeader } from "./AppHeader";

export function AppShell() {
  const capabilities = useDemoCapabilities();
  const activity = useDemoSelector((state) => state.activity);
  const mode = useDemoSelector((state) => state.mode);
  const tools = useMemo(
    () => createExposedWebMcpTools(capabilities, mode),
    [capabilities, mode],
  );
  const webMcpStatus = useWebMcpStatus(tools);
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
        {activity
          ? `${activity.source === "webmcp" ? "WebMCP" : "In app"}: ${activity.message}`
          : ""}
      </div>
    </div>
  );
}
