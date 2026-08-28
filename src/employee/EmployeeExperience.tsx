import { Tabs, type TabDefinition } from "../components/Tabs";
import { useDemoSelector, useDemoStore } from "../demo/DemoProvider";
import { selectEmployeeDashboard } from "../demo/selectors";
import type { EmployeeTab } from "../demo/types";
import { EmployeeLearning } from "./EmployeeLearning";
import { EmployeeOverview } from "./EmployeeOverview";
import { EmployeeRewards } from "./EmployeeRewards";
import { EmployeeShifts } from "./EmployeeShifts";

export function EmployeeExperience() {
  const dashboard = useDemoSelector(selectEmployeeDashboard);
  const firstName = useDemoSelector(
    (state) => state.employee.profile.firstName,
  );
  const activeTab = useDemoSelector((state) => state.employee.activeTab);
  const store = useDemoStore();
  const tabs: TabDefinition[] = [
    { id: "overview", label: "Overview", panel: <EmployeeOverview /> },
    { id: "shifts", label: "Shifts", panel: <EmployeeShifts /> },
    { id: "learn", label: "Learn", panel: <EmployeeLearning /> },
    { id: "rewards", label: "Rewards", panel: <EmployeeRewards /> },
  ];

  return (
    <main
      aria-labelledby="employee-title"
      className="app-shell__content employee-experience"
    >
      <header className="employee-experience__header">
        <p className="eyebrow">
          {dashboard.employerName} · {dashboard.role}
        </p>
        <h1 id="employee-title">Hey {firstName} 👋</h1>
        <p>Your next move can bring your goal closer.</p>
      </header>
      <Tabs
        ariaLabel="Employee dashboard"
        onSelect={(tab) =>
          store.dispatch({
            type: "navigation/set-employee-tab",
            tab: tab as EmployeeTab,
          })
        }
        selectedId={activeTab}
        tabs={tabs}
      />
    </main>
  );
}
