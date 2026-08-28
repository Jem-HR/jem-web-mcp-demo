import {
  appliedResult,
  errorResult,
  previewResult,
  readResult,
  type CapabilityResult,
} from "./capability-result";
import {
  selectAffordability,
  selectEmployeeDashboard,
  selectGoalProgress,
  type AffordabilitySummary,
  type EmployeeDashboard,
  type GoalProgress,
} from "./selectors";
import type {
  ActionSource,
  DemoState,
  DemoStore,
  ExpenseKey,
  ExpenseMap,
  Goal,
  OpportunityCategory,
  RewardDestination,
} from "./types";

const DEMO_DATE = "2026-08-28";
const expenseKeys: readonly ExpenseKey[] = [
  "housing",
  "transport",
  "food",
  "dependants",
  "debt",
  "airtime",
  "other",
];

export interface UpdateSavingsGoalInput extends Goal {
  confirm: boolean;
}

export type UpdateExpensesInput = ExpenseMap;

export interface GoalChange {
  before: Goal;
  after: Goal;
  progress: GoalProgress;
}

export interface EmployeeOpportunity {
  id: string;
  category: Exclude<OpportunityCategory, "all">;
  title: string;
  description: string;
  benefit: {
    amount: number;
    rewardType: "cash" | "voucher";
    certainty: "estimated" | "confirmed" | "conditional";
  };
  effort: string;
  eligibility: string;
  expiresOn: string | null;
  state: string;
}

export interface RequestShiftInput {
  shiftId: string;
  confirm: boolean;
}

export interface ShiftRequestResult {
  shiftId: string;
  status: "requested";
  estimatedEarnings: number;
  estimateKind: "estimated_before_deductions";
  alreadyRequested: boolean;
}

export interface AllocateRewardInput {
  rewardId: string;
  destination: RewardDestination;
  confirm: boolean;
}

export interface RewardAllocationResult {
  rewardId: string;
  destination: RewardDestination;
  amount: number;
  goalSavedAmount: number;
}

export interface EmployeeCapabilities {
  getDashboard(): CapabilityResult<EmployeeDashboard>;
  updateSavingsGoal(
    input: UpdateSavingsGoalInput,
    source?: ActionSource,
  ): CapabilityResult<GoalChange>;
  updateExpenses(
    input: UpdateExpensesInput,
    source?: ActionSource,
  ): CapabilityResult<AffordabilitySummary>;
  listOpportunities(input?: {
    category?: OpportunityCategory;
  }): CapabilityResult<EmployeeOpportunity[]>;
  requestShift(
    input: RequestShiftInput,
    source?: ActionSource,
  ): CapabilityResult<ShiftRequestResult>;
  allocateReward(
    input: AllocateRewardInput,
    source?: ActionSource,
  ): CapabilityResult<RewardAllocationResult>;
}

function copyGoal(goal: Goal): Goal {
  return { ...goal };
}

function isValidIsoDateAfterDemoDate(date: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date <= DEMO_DATE) return false;

  const parsed = new Date(`${date}T00:00:00.000Z`);
  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === date
  );
}

function isNonNegativeMoney(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function validGoal(
  input: UpdateSavingsGoalInput,
): input is UpdateSavingsGoalInput {
  return (
    typeof input.name === "string" &&
    input.name.trim().length > 0 &&
    typeof input.emoji === "string" &&
    input.emoji.trim().length > 0 &&
    isNonNegativeMoney(input.targetAmount) &&
    input.targetAmount > 0 &&
    isNonNegativeMoney(input.savedAmount) &&
    input.savedAmount <= input.targetAmount &&
    isNonNegativeMoney(input.monthlyContribution) &&
    typeof input.targetDate === "string" &&
    isValidIsoDateAfterDemoDate(input.targetDate) &&
    typeof input.isPrivate === "boolean" &&
    typeof input.confirm === "boolean"
  );
}

function validExpenses(input: UpdateExpensesInput): input is ExpenseMap {
  if (input === null || typeof input !== "object") return false;

  const keys = Object.keys(input);
  return (
    keys.length === expenseKeys.length &&
    expenseKeys.every(
      (key) => Object.hasOwn(input, key) && isNonNegativeMoney(input[key]),
    )
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object";
}

function validRequestShiftInput(input: unknown): input is RequestShiftInput {
  return (
    isRecord(input) &&
    typeof input.shiftId === "string" &&
    input.shiftId.trim().length > 0 &&
    typeof input.confirm === "boolean"
  );
}

function validAllocateRewardInput(
  input: unknown,
): input is AllocateRewardInput {
  return (
    isRecord(input) &&
    typeof input.rewardId === "string" &&
    input.rewardId.trim().length > 0 &&
    (input.destination === "savings" || input.destination === "voucher") &&
    typeof input.confirm === "boolean"
  );
}

function goalChange(state: DemoState, after: Goal): GoalChange {
  const draftState: DemoState = {
    ...state,
    employee: { ...state.employee, goal: after },
  };

  return {
    before: copyGoal(state.employee.goal),
    after: copyGoal(after),
    progress: selectGoalProgress(draftState),
  };
}

function shiftRequestResult(
  shift: DemoState["employee"]["shifts"][number],
  alreadyRequested: boolean,
): ShiftRequestResult {
  return {
    shiftId: shift.id,
    status: "requested",
    estimatedEarnings: shift.estimatedEarnings,
    estimateKind: "estimated_before_deductions",
    alreadyRequested,
  };
}

function employeeOpportunities(state: DemoState): EmployeeOpportunity[] {
  const shifts = state.employee.shifts
    .filter((shift) => shift.status !== "confirmed")
    .map((shift) => ({
      id: shift.id,
      category: "shift" as const,
      title: `${shift.role} at ${shift.site}`,
      description: `${shift.date}, ${shift.startTime}–${shift.endTime}`,
      benefit: {
        amount: shift.estimatedEarnings,
        rewardType: "cash" as const,
        certainty: "estimated" as const,
      },
      effort: `${Math.round(
        (Date.parse(`1970-01-01T${shift.endTime}:00Z`) -
          Date.parse(`1970-01-01T${shift.startTime}:00Z`)) /
          3_600_000,
      )} hours`,
      eligibility: shift.eligibility,
      expiresOn: shift.deadline,
      state: shift.status,
    }));
  const learning = state.employee.learning.map((record) => ({
    id: record.id,
    category: "learning" as const,
    title: record.title,
    description: record.description,
    benefit: {
      amount: record.rewardAmount,
      rewardType: record.rewardType,
      certainty: "conditional" as const,
    },
    effort: `${record.durationMinutes} minutes`,
    eligibility: "Complete the learning module",
    expiresOn: record.expiresOn,
    state: record.completed ? "completed" : "available",
  }));
  const rewards = state.employee.rewards.map((reward) => ({
    id: reward.id,
    category: "reward" as const,
    title: reward.title,
    description: reward.description,
    benefit: {
      amount: reward.amount,
      rewardType: reward.rewardType,
      certainty:
        reward.status === "earned"
          ? ("confirmed" as const)
          : ("conditional" as const),
    },
    effort: reward.description,
    eligibility: reward.description,
    expiresOn: reward.deadline,
    state: reward.status,
  }));

  return [...shifts, ...learning, ...rewards];
}

export function createEmployeeCapabilities(
  store: DemoStore,
): EmployeeCapabilities {
  return {
    getDashboard() {
      return readResult(
        "Employee dashboard ready.",
        selectEmployeeDashboard(store.getState()),
      );
    },

    updateSavingsGoal(input, source = "webmcp") {
      if (!validGoal(input)) {
        return errorResult(
          "INVALID_INPUT",
          "Enter a valid savings goal.",
          "Provide a name, valid amounts and a future target date.",
        );
      }

      const after: Goal = {
        name: input.name,
        emoji: input.emoji,
        targetAmount: input.targetAmount,
        savedAmount: input.savedAmount,
        targetDate: input.targetDate,
        monthlyContribution: input.monthlyContribution,
        isPrivate: input.isPrivate,
      };
      const change = goalChange(store.getState(), after);
      if (!input.confirm) {
        return previewResult("Savings goal update ready to confirm.", change);
      }

      store.dispatch({ type: "employee/replace-goal", goal: after, source });
      return appliedResult("Savings goal updated.", change);
    },

    updateExpenses(input, source = "webmcp") {
      if (source !== "ui") {
        return errorResult(
          "UNSUPPORTED_WEBMCP",
          "Expenses can only be updated in the employee app.",
          "Update expenses from the employee dashboard.",
        );
      }
      if (!validExpenses(input)) {
        return errorResult(
          "INVALID_INPUT",
          "Enter valid monthly expenses.",
          "Provide all seven expense amounts as zero or more.",
        );
      }

      store.dispatch({
        type: "employee/replace-expenses",
        expenses: input,
        source,
      });
      return appliedResult(
        "Monthly expenses updated.",
        selectAffordability(store.getState()),
      );
    },

    listOpportunities(input = {}) {
      const category = input.category ?? "all";
      const opportunities = employeeOpportunities(store.getState()).filter(
        (opportunity) =>
          category === "all" || opportunity.category === category,
      );
      return readResult("Employee opportunities ready.", opportunities);
    },

    requestShift(input, source = "webmcp") {
      if (!validRequestShiftInput(input)) {
        return errorResult(
          "INVALID_INPUT",
          "Enter a valid shift request.",
          "Provide a shift ID and choose whether to confirm it.",
        );
      }

      const shift = store
        .getState()
        .employee.shifts.find((candidate) => candidate.id === input.shiftId);
      if (shift === undefined) {
        return errorResult(
          "NOT_FOUND",
          "That shift is not available.",
          "Choose a shift from the current opportunities.",
        );
      }
      if (shift.status === "confirmed") {
        return errorResult(
          "INVALID_INPUT",
          "A confirmed shift cannot be requested.",
          "Choose an available shift instead.",
        );
      }
      if (shift.status === "requested") {
        return appliedResult(
          "Shift request already recorded.",
          shiftRequestResult(shift, true),
        );
      }

      const result = shiftRequestResult(shift, false);
      if (!input.confirm) {
        return previewResult("Shift request ready to confirm.", result);
      }

      store.dispatch({
        type: "employee/request-shift",
        shiftId: shift.id,
        source,
      });
      return appliedResult("Shift request submitted.", result);
    },

    allocateReward(input, source = "webmcp") {
      if (!validAllocateRewardInput(input)) {
        return errorResult(
          "INVALID_INPUT",
          "Enter a valid reward allocation.",
          "Provide a reward ID, savings or voucher destination, and confirmation.",
        );
      }

      const state = store.getState();
      const reward = state.employee.rewards.find(
        (candidate) => candidate.id === input.rewardId,
      );
      if (reward === undefined) {
        return errorResult(
          "NOT_FOUND",
          "That reward is not available.",
          "Choose a reward from the current opportunities.",
        );
      }
      if (reward.allocatedTo !== null) {
        return errorResult(
          "REWARD_ALREADY_ALLOCATED",
          "This reward has already been allocated.",
          "Choose another earned reward.",
        );
      }
      if (reward.status !== "earned") {
        return errorResult(
          "REWARD_NOT_EARNED",
          "This reward has not been earned yet.",
          "Complete the qualifying activity first.",
        );
      }

      const goalSavedAmount =
        input.destination === "savings"
          ? state.employee.goal.savedAmount + reward.amount
          : state.employee.goal.savedAmount;
      const result: RewardAllocationResult = {
        rewardId: reward.id,
        destination: input.destination,
        amount: reward.amount,
        goalSavedAmount,
      };
      if (!input.confirm) {
        return previewResult("Reward allocation ready to confirm.", result);
      }

      store.dispatch({
        type: "employee/allocate-reward",
        rewardId: reward.id,
        destination: input.destination,
        source,
      });
      return appliedResult("Reward allocated.", result);
    },
  };
}
