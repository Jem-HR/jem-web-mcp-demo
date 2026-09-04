import { describe, expect, it } from "vitest";
import { createInitialDemoState } from "./fixtures";
import {
  selectAffordability,
  selectEmployeeDashboard,
  selectEmployerDashboard,
  selectGoalProgress,
} from "./selectors";

describe("demo selectors", () => {
  const state = createInitialDemoState();

  it("derives Nomsa's goal and affordability without mutating state", () => {
    expect(selectGoalProgress(state)).toEqual({
      saved: 2520,
      target: 6000,
      remaining: 3480,
      percentage: 42,
      monthsRemaining: 9,
    });
    expect(selectAffordability(state)).toMatchObject({
      expectedEarnings: 4800,
      totalExpenses: 3600,
      availableAfterExpenses: 1200,
      suggestedMonthlyContribution: 400,
    });
  });

  it("keeps employee financial fields out of the employer dashboard", () => {
    const dashboard = selectEmployerDashboard(state);
    expect(dashboard).toMatchObject({ employerName: "Pick n Pay Retail" });
    expect(JSON.stringify(dashboard)).not.toContain("2520");
    expect(JSON.stringify(dashboard)).not.toContain("3600");
    expect(selectEmployeeDashboard(state).goal.name).toBe("School Fees");
  });
});
