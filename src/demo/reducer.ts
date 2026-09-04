import { createInitialDemoState } from "./fixtures";
import { policyDecisionForTool, policyForSession } from "./policy";
import type {
  ActionSource,
  ActorId,
  AgentAuditEvent,
  AgentAuditEventType,
  ActivityNotice,
  DemoAction,
  DemoState,
  Goal,
  OpportunityDraft,
  OpportunityValidation,
} from "./types";

function sessionForActor(
  actorId: ActorId,
  policyRevision: number,
): DemoState["actorSession"] {
  return {
    actorId,
    displayName: actorId === "employee" ? "Nomsa Dlamini" : "Sipho Khumalo",
    policyRevision,
  };
}

function auditEvent(
  state: DemoState,
  type: AgentAuditEventType,
  action: string,
  summary: string,
  source: ActionSource | "system" = "system",
  actorSession: DemoState["actorSession"] = state.actorSession,
): AgentAuditEvent {
  const revision = state.revision + 1;
  return {
    id: `audit-${revision}`,
    type,
    actorId: actorSession.actorId,
    source,
    action,
    outcome: "applied",
    policyRevision: actorSession.policyRevision,
    stateRevision: revision,
    summary,
    timestamp: `demo-revision-${revision}`,
  };
}

function mutate(
  state: DemoState,
  changes: Omit<DemoState, "revision" | "auditEvents">,
  type: AgentAuditEventType,
  action: string,
  summary: string,
  source?: ActionSource | "system",
): DemoState {
  const event = auditEvent(
    state,
    type,
    action,
    summary,
    source,
    changes.actorSession,
  );
  return {
    ...changes,
    revision: event.stateRevision,
    auditEvents: [...state.auditEvents, event],
  };
}

function toolForAction(action: DemoAction): string | null {
  switch (action.type) {
    case "employee/replace-goal":
      return "update_savings_goal";
    case "employee/replace-expenses":
      return "update_expenses";
    case "employee/complete-onboarding":
      return "complete_onboarding_plan";
    case "employee/request-shift":
      return "request_shift";
    case "employee/allocate-reward":
      return "allocate_reward";
    case "employer/save-draft":
      return "create_opportunity_draft";
    case "employer/set-validation":
      return "validate_opportunity";
    default:
      return null;
  }
}

function recordPolicyDenial(state: DemoState, toolName: string): DemoState {
  const decision = policyDecisionForTool(
    policyForSession(state.actorSession),
    toolName,
  );
  if (decision.permitted) return state;

  const event = auditEvent(
    state,
    "policy_denied",
    toolName,
    decision.error.message,
    "webmcp",
  );
  return {
    ...state,
    revision: event.stateRevision,
    auditEvents: [...state.auditEvents, { ...event, outcome: "denied" }],
  };
}

function auditDescriptor(type: AgentAuditEventType): {
  action: string;
  summary: string;
  outcome: AgentAuditEvent["outcome"];
} {
  switch (type) {
    case "actor_changed":
      return {
        action: "session/set-actor",
        summary: "Switched simulated actor scope.",
        outcome: "recorded",
      };
    case "policy_changed":
      return {
        action: "policy/changed",
        summary: "Updated simulated actor policy.",
        outcome: "recorded",
      };
    case "policy_denied":
      return {
        action: "policy_denied",
        summary: "This action is outside the simulated actor scope.",
        outcome: "denied",
      };
    default:
      return {
        action: type,
        summary: "Recorded a simulated agent action.",
        outcome: "recorded",
      };
  }
}

function activityFor(
  state: DemoState,
  source: ActionSource,
  message: string,
): ActivityNotice {
  return { id: (state.activity?.id ?? 0) + 1, source, message };
}

function copyGoal(goal: Goal): Goal {
  return { ...goal };
}

function copyDraft(draft: OpportunityDraft): OpportunityDraft {
  return { ...draft };
}

function copyValidation(
  validation: OpportunityValidation,
): OpportunityValidation {
  return { ...validation, issues: [...validation.issues] };
}

export function demoReducer(state: DemoState, action: DemoAction): DemoState {
  const toolName = toolForAction(action);
  if (toolName !== null) {
    const decision = policyDecisionForTool(
      policyForSession(state.actorSession),
      toolName,
    );
    if (!decision.permitted) return recordPolicyDenial(state, toolName);
  }

  switch (action.type) {
    case "demo/reset": {
      const initial = createInitialDemoState();
      const actorChanged = state.actorSession.actorId !== "employee";
      const policyRevision = state.actorSession.policyRevision + 1;
      return mutate(
        state,
        {
          ...initial,
          actorSession: sessionForActor("employee", policyRevision),
          onboarding: { completed: false, step: 1 },
        },
        actorChanged ? "actor_changed" : "policy_changed",
        "demo/reset",
        actorChanged
          ? "Reset demo and switched simulated actor scope."
          : "Reset demo and refreshed simulated actor policy.",
        "ui",
      );
    }

    case "session/set-actor": {
      if (state.actorSession.actorId === action.actorId) return state;

      const policyRevision = state.actorSession.policyRevision + 1;
      return mutate(
        state,
        {
          ...state,
          mode: action.actorId,
          actorSession: sessionForActor(action.actorId, policyRevision),
        },
        "actor_changed",
        "session/set-actor",
        "Switched simulated actor scope.",
        "ui",
      );
    }

    case "navigation/set-mode": {
      if (
        state.mode === action.mode &&
        state.actorSession.actorId === action.mode
      ) {
        return state;
      }

      const policyRevision = state.actorSession.policyRevision + 1;
      return mutate(
        state,
        {
          ...state,
          mode: action.mode,
          actorSession: sessionForActor(action.mode, policyRevision),
        },
        "actor_changed",
        "navigation/set-mode",
        "Switched simulated actor scope.",
        "ui",
      );
    }

    case "navigation/set-employee-tab":
      return state.employee.activeTab === action.tab
        ? state
        : mutate(
            state,
            {
              ...state,
              employee: { ...state.employee, activeTab: action.tab },
            },
            "business_mutation",
            "navigation/set-employee-tab",
            "Changed employee view.",
            "ui",
          );

    case "navigation/set-employer-tab":
      return state.employer.activeTab === action.tab
        ? state
        : mutate(
            state,
            {
              ...state,
              employer: { ...state.employer, activeTab: action.tab },
            },
            "business_mutation",
            "navigation/set-employer-tab",
            "Changed employer view.",
            "ui",
          );

    case "onboarding/set-step":
      return state.onboarding.step === action.step
        ? state
        : mutate(
            state,
            {
              ...state,
              onboarding: { ...state.onboarding, step: action.step },
            },
            "business_mutation",
            "onboarding/set-step",
            "Updated onboarding progress.",
            "ui",
          );

    case "onboarding/complete":
      return state.onboarding.completed
        ? state
        : mutate(
            state,
            { ...state, onboarding: { ...state.onboarding, completed: true } },
            "business_mutation",
            "onboarding/complete",
            "Completed onboarding.",
            "ui",
          );

    case "employee/replace-goal":
      return mutate(
        state,
        {
          ...state,
          employee: { ...state.employee, goal: copyGoal(action.goal) },
          activity: activityFor(state, action.source, "Savings goal updated."),
        },
        "business_mutation",
        "employee/replace-goal",
        "Updated savings goal.",
        action.source,
      );

    case "employee/replace-expenses":
      return mutate(
        state,
        {
          ...state,
          employee: { ...state.employee, expenses: { ...action.expenses } },
          activity: activityFor(
            state,
            action.source,
            "Updated monthly expenses.",
          ),
        },
        "business_mutation",
        "employee/replace-expenses",
        "Updated monthly expenses.",
        action.source,
      );

    case "employee/complete-onboarding":
      return mutate(
        state,
        {
          ...state,
          onboarding: { ...state.onboarding, completed: true },
          employee: {
            ...state.employee,
            goal: copyGoal(action.goal),
            expenses: { ...action.expenses },
          },
          activity: activityFor(state, action.source, "Onboarding plan saved."),
        },
        "business_mutation",
        "employee/complete-onboarding",
        "Saved onboarding plan.",
        action.source,
      );

    case "employee/request-shift": {
      const shiftIndex = state.employee.shifts.findIndex(
        (shift) => shift.id === action.shiftId,
      );
      const shift = state.employee.shifts[shiftIndex];
      if (shift === undefined || shift.status !== "available") return state;

      const shifts = [...state.employee.shifts];
      shifts[shiftIndex] = {
        ...shift,
        status: "requested",
        applications: shift.applications + 1,
      };
      return mutate(
        state,
        {
          ...state,
          employee: { ...state.employee, shifts },
          activity: activityFor(
            state,
            action.source,
            "Requested an additional shift.",
          ),
        },
        "business_mutation",
        "employee/request-shift",
        "Requested an additional shift.",
        action.source,
      );
    }

    case "employee/allocate-reward": {
      const rewardIndex = state.employee.rewards.findIndex(
        (reward) => reward.id === action.rewardId,
      );
      const reward = state.employee.rewards[rewardIndex];
      if (
        reward === undefined ||
        reward.status !== "earned" ||
        reward.allocatedTo !== null
      ) {
        return state;
      }

      const rewards = [...state.employee.rewards];
      rewards[rewardIndex] = {
        ...reward,
        status: "allocated",
        allocatedTo: action.destination,
      };
      const goal =
        action.destination === "savings"
          ? {
              ...state.employee.goal,
              savedAmount: state.employee.goal.savedAmount + reward.amount,
            }
          : state.employee.goal;
      return mutate(
        state,
        {
          ...state,
          employee: { ...state.employee, goal, rewards },
          activity: activityFor(state, action.source, "Allocated a reward."),
        },
        "business_mutation",
        "employee/allocate-reward",
        "Allocated a reward.",
        action.source,
      );
    }

    case "employer/save-draft":
      return mutate(
        state,
        {
          ...state,
          employer: {
            ...state.employer,
            activeDraft: copyDraft(action.draft),
            validation: null,
          },
          activity: activityFor(
            state,
            action.source,
            "Saved opportunity draft.",
          ),
        },
        "business_mutation",
        "employer/save-draft",
        "Saved opportunity draft.",
        action.source,
      );

    case "employer/set-validation":
      return mutate(
        state,
        {
          ...state,
          employer: {
            ...state.employer,
            validation: copyValidation(action.validation),
          },
          activity: activityFor(
            state,
            action.source,
            "Validated opportunity draft.",
          ),
        },
        "business_mutation",
        "employer/set-validation",
        "Validated opportunity draft.",
        action.source,
      );

    case "audit/record": {
      const descriptor = auditDescriptor(action.eventType);
      const event = auditEvent(
        state,
        action.eventType,
        descriptor.action,
        descriptor.summary,
        "system",
      );
      return {
        ...state,
        revision: event.stateRevision,
        auditEvents: [
          ...state.auditEvents,
          { ...event, outcome: descriptor.outcome },
        ],
      };
    }

    case "activity/dismiss":
      return state.activity === null
        ? state
        : mutate(
            state,
            { ...state, activity: null },
            "business_mutation",
            "activity/dismiss",
            "Dismissed activity notice.",
            "ui",
          );
  }
}
