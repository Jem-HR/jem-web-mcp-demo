import { describe, expect, it } from "vitest";
import {
  policyDecisionForTool,
  isToolPermitted,
  policyForSession,
} from "./policy";

describe("policyForSession", () => {
  it("resolves the employee's simulated identity and employee-only tools", () => {
    const policy = policyForSession({
      actorId: "employee",
      displayName: "Nomsa Dlamini",
      policyRevision: 1,
    });

    expect(policy).toMatchObject({
      actorId: "employee",
      actorLabel: "Nomsa Dlamini",
      revision: 1,
      viewMode: "employee",
    });
    expect(isToolPermitted(policy, "get_employee_dashboard")).toBe(true);
    expect(isToolPermitted(policy, "allocate_reward")).toBe(true);
    expect(isToolPermitted(policy, "get_employer_dashboard")).toBe(false);
    expect(isToolPermitted(policy, "create_opportunity_draft")).toBe(false);
  });

  it("resolves the employer's simulated identity and aggregate-only tools", () => {
    const policy = policyForSession({
      actorId: "employer",
      displayName: "Sipho Khumalo",
      policyRevision: 2,
    });

    expect(policy).toMatchObject({
      actorId: "employer",
      actorLabel: "Sipho Khumalo",
      revision: 2,
      viewMode: "employer",
    });
    expect(isToolPermitted(policy, "get_employer_dashboard")).toBe(true);
    expect(isToolPermitted(policy, "list_fairness_exceptions")).toBe(true);
    expect(isToolPermitted(policy, "get_employee_dashboard")).toBe(false);
    expect(isToolPermitted(policy, "update_savings_goal")).toBe(false);
  });

  it("returns a recoverable denial when a tool is outside the simulated actor scope", () => {
    const decision = policyDecisionForTool(
      policyForSession({
        actorId: "employer",
        displayName: "Sipho Khumalo",
        policyRevision: 2,
      }),
      "update_savings_goal",
    );

    expect(decision).toEqual({
      permitted: false,
      error: {
        code: "POLICY_DENIED",
        message: "This action is outside the simulated actor scope.",
        nextStep: "Inspect active context or switch simulated actor scope.",
      },
    });
  });
});
