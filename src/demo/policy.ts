import type { ActorSession, CapabilityPolicy, PolicyDecision } from "./types";

const employeeTools = [
  "get_employee_dashboard",
  "update_savings_goal",
  "list_employee_opportunities",
  "request_shift",
  "allocate_reward",
  "update_expenses",
  "complete_onboarding_plan",
  "prepare_shift_to_goal_plan",
] as const;

const employerTools = [
  "get_employer_dashboard",
  "list_programmes",
  "create_opportunity_draft",
  "validate_opportunity",
  "list_open_shifts",
  "list_fairness_exceptions",
] as const;

export function policyForSession(session: ActorSession): CapabilityPolicy {
  const employee = session.actorId === "employee";

  return {
    actorId: session.actorId,
    actorLabel: session.displayName,
    revision: session.policyRevision,
    viewMode: session.actorId,
    permittedTools: employee ? employeeTools : employerTools,
    protectedDataClasses: employee
      ? ["employee_private_financial_data"]
      : ["aggregate_employer_data"],
    consequentialTools: employee
      ? [
          "update_savings_goal",
          "request_shift",
          "allocate_reward",
          "prepare_shift_to_goal_plan",
        ]
      : ["create_opportunity_draft"],
  };
}

export function isToolPermitted(
  policy: CapabilityPolicy,
  toolName: string,
): boolean {
  return policy.permittedTools.includes(toolName);
}

export function policyDecisionForTool(
  policy: CapabilityPolicy,
  toolName: string,
): PolicyDecision {
  if (isToolPermitted(policy, toolName)) return { permitted: true };

  return {
    permitted: false,
    error: {
      code: "POLICY_DENIED",
      message: "This action is outside the simulated actor scope.",
      nextStep: "Inspect active context or switch simulated actor scope.",
    },
  };
}
