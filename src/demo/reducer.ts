import { createInitialDemoState } from "./fixtures";
import type {
  ActionSource,
  ActivityNotice,
  DemoAction,
  DemoState,
  Goal,
  OpportunityDraft,
  OpportunityValidation,
} from "./types";

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
  switch (action.type) {
    case "demo/reset": {
      const initial = createInitialDemoState();
      return { ...initial, onboarding: { completed: false, step: 1 } };
    }

    case "navigation/set-mode":
      return state.mode === action.mode
        ? state
        : { ...state, mode: action.mode };

    case "navigation/set-employee-tab":
      return state.employee.activeTab === action.tab
        ? state
        : {
            ...state,
            employee: { ...state.employee, activeTab: action.tab },
          };

    case "navigation/set-employer-tab":
      return state.employer.activeTab === action.tab
        ? state
        : {
            ...state,
            employer: { ...state.employer, activeTab: action.tab },
          };

    case "onboarding/set-step":
      return state.onboarding.step === action.step
        ? state
        : { ...state, onboarding: { ...state.onboarding, step: action.step } };

    case "onboarding/complete":
      return state.onboarding.completed
        ? state
        : { ...state, onboarding: { ...state.onboarding, completed: true } };

    case "employee/replace-goal":
      return {
        ...state,
        employee: { ...state.employee, goal: copyGoal(action.goal) },
        activity: activityFor(state, action.source, "Savings goal updated."),
      };

    case "employee/replace-expenses":
      return {
        ...state,
        employee: { ...state.employee, expenses: { ...action.expenses } },
        activity: activityFor(
          state,
          action.source,
          "Updated monthly expenses.",
        ),
      };

    case "employee/complete-onboarding":
      return {
        ...state,
        onboarding: { ...state.onboarding, completed: true },
        employee: {
          ...state.employee,
          goal: copyGoal(action.goal),
          expenses: { ...action.expenses },
        },
        activity: activityFor(state, action.source, "Onboarding plan saved."),
      };

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
      return {
        ...state,
        employee: { ...state.employee, shifts },
        activity: activityFor(
          state,
          action.source,
          "Requested an additional shift.",
        ),
      };
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
      return {
        ...state,
        employee: { ...state.employee, goal, rewards },
        activity: activityFor(state, action.source, "Allocated a reward."),
      };
    }

    case "employer/save-draft":
      return {
        ...state,
        employer: {
          ...state.employer,
          activeDraft: copyDraft(action.draft),
          validation: null,
        },
        activity: activityFor(state, action.source, "Saved opportunity draft."),
      };

    case "employer/set-validation":
      return {
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
      };

    case "activity/dismiss":
      return state.activity === null ? state : { ...state, activity: null };
  }
}
