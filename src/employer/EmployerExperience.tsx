import { Tabs, type TabDefinition } from "../components/Tabs";
import {
  useDemoCapabilities,
  useDemoSelector,
  useDemoStore,
} from "../demo/DemoProvider";
import type { EmployerTab } from "../demo/types";
import { EmployerDashboard } from "./EmployerDashboard";
import { EmployerShifts } from "./EmployerShifts";
import { FairnessData } from "./FairnessData";
import { OpportunityBuilder } from "./OpportunityBuilder";

export function EmployerExperience() {
  const dashboardResult = useDemoCapabilities().employer.getDashboard();
  const activeTab = useDemoSelector((state) => state.employer.activeTab);
  const store = useDemoStore();
  const employerTabs: TabDefinition[] = [
    { id: "dashboard", label: "Dashboard", panel: <EmployerDashboard /> },
    {
      id: "opportunity",
      label: "Create Opportunity",
      panel: <OpportunityBuilder />,
    },
    { id: "shifts", label: "Manage Shifts", panel: <EmployerShifts /> },
    { id: "fairness", label: "Fairness & Data", panel: <FairnessData /> },
  ];

  return (
    <main
      aria-labelledby="employer-title"
      className="app-shell__content employer-experience"
    >
      <header className="employer-experience__header">
        <p className="eyebrow">
          {dashboardResult.ok
            ? `${dashboardResult.data.employerName} · ${dashboardResult.data.role}`
            : "Employer Hub"}
        </p>
        <h1 id="employer-title">Workforce overview</h1>
        <p>See programme performance and create fair opportunities.</p>
      </header>
      <div className="employer-experience__tabs">
        <Tabs
          ariaLabel="Employer Hub"
          selectedId={activeTab}
          onSelect={(tab) =>
            store.dispatch({
              type: "navigation/set-employer-tab",
              tab: tab as EmployerTab,
            })
          }
          tabs={employerTabs}
        />
      </div>
    </main>
  );
}
