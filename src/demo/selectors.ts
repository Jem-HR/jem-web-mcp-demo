import type { DemoState, Goal, Programme, Reward, Shift } from "./types";

export interface GoalProgress {
  saved: number;
  target: number;
  remaining: number;
  percentage: number;
  monthsRemaining: number;
}

export interface AffordabilitySummary {
  expectedEarnings: number;
  totalExpenses: number;
  availableAfterExpenses: number;
  suggestedMonthlyContribution: number;
}

export interface EmployeeDashboard {
  employeeName: string;
  employerName: string;
  role: string;
  goal: Goal;
  goalProgress: GoalProgress;
  nextPayday: string;
  daysToPayday: number;
  expectedEarnings: number;
  hoursWorked: number;
  confirmedShiftCount: number;
  availableShiftCount: number;
  requestedShiftCount: number;
  learningSummary: { total: number; completed: number };
  rewardSummary: { total: number; earned: number; allocated: number };
  nextAction: Pick<
    Shift,
    "id" | "role" | "site" | "estimatedEarnings" | "estimateKind" | "deadline"
  > | null;
}

export interface EmployerDashboard {
  employerName: string;
  contactName: string;
  role: string;
  totalEmployees: number;
  activeEmployees: number;
  goalEngagementPercent: number;
  dataConfidencePercent: number;
  activeProgrammeCount: number;
  programmeCount: number;
  totalProgrammeBudget: number;
  programmeSpend: number;
  participationCount: number;
  openShiftCount: number;
  requestedShiftCount: number;
  fairnessExceptionCount: number;
  fairnessRules: string[];
}

function countByStatus<T extends { status: string }>(
  records: readonly T[],
  status: string,
): number {
  return records.filter((record) => record.status === status).length;
}

function programmeTotal(
  programmes: readonly Programme[],
  key: "budget" | "spent",
) {
  return programmes.reduce((total, programme) => total + programme[key], 0);
}

function rewardCount(
  rewards: readonly Reward[],
  status: Reward["status"],
): number {
  return rewards.filter((reward) => reward.status === status).length;
}

export function selectGoalProgress(state: DemoState): GoalProgress {
  const { savedAmount, targetAmount, monthlyContribution } =
    state.employee.goal;
  const remaining = Math.max(targetAmount - savedAmount, 0);
  return {
    saved: savedAmount,
    target: targetAmount,
    remaining,
    percentage:
      targetAmount === 0 ? 0 : Math.round((savedAmount / targetAmount) * 100),
    monthsRemaining:
      monthlyContribution === 0
        ? 0
        : Math.ceil(remaining / monthlyContribution),
  };
}

export function selectAffordability(state: DemoState): AffordabilitySummary {
  const totalExpenses = Object.values(state.employee.expenses).reduce(
    (total, expense) => total + expense,
    0,
  );
  const { expectedEarnings } = state.employee.profile;
  return {
    expectedEarnings,
    totalExpenses,
    availableAfterExpenses: expectedEarnings - totalExpenses,
    suggestedMonthlyContribution: state.employee.goal.monthlyContribution,
  };
}

export function selectEmployeeDashboard(state: DemoState): EmployeeDashboard {
  const { employee } = state;
  const nextShift = employee.shifts.find(
    (shift) => shift.status === "available",
  );
  return {
    employeeName: employee.profile.fullName,
    employerName: employee.profile.employerName,
    role: employee.profile.role,
    goal: { ...employee.goal },
    goalProgress: selectGoalProgress(state),
    nextPayday: employee.profile.nextPayday,
    daysToPayday: employee.profile.daysToPayday,
    expectedEarnings: employee.profile.expectedEarnings,
    hoursWorked: employee.profile.hoursWorked,
    confirmedShiftCount: countByStatus(employee.shifts, "confirmed"),
    availableShiftCount: countByStatus(employee.shifts, "available"),
    requestedShiftCount: countByStatus(employee.shifts, "requested"),
    learningSummary: {
      total: employee.learning.length,
      completed: employee.learning.filter((learning) => learning.completed)
        .length,
    },
    rewardSummary: {
      total: employee.rewards.length,
      earned: rewardCount(employee.rewards, "earned"),
      allocated: rewardCount(employee.rewards, "allocated"),
    },
    nextAction: nextShift
      ? {
          id: nextShift.id,
          role: nextShift.role,
          site: nextShift.site,
          estimatedEarnings: nextShift.estimatedEarnings,
          estimateKind: nextShift.estimateKind,
          deadline: nextShift.deadline,
        }
      : null,
  };
}

export function selectEmployerDashboard(state: DemoState): EmployerDashboard {
  const { employer, employee } = state;
  return {
    employerName: employer.profile.employerName,
    contactName: employer.profile.contactName,
    role: employer.profile.role,
    totalEmployees: employer.profile.totalEmployees,
    activeEmployees: employer.profile.activeEmployees,
    goalEngagementPercent: employer.profile.goalEngagementPercent,
    dataConfidencePercent: employer.profile.dataConfidencePercent,
    activeProgrammeCount: countByStatus(employer.programmes, "active"),
    programmeCount: employer.programmes.length,
    totalProgrammeBudget: programmeTotal(employer.programmes, "budget"),
    programmeSpend: programmeTotal(employer.programmes, "spent"),
    participationCount: employer.programmes.reduce(
      (total, programme) => total + programme.participating,
      0,
    ),
    openShiftCount: countByStatus(employee.shifts, "available"),
    requestedShiftCount: countByStatus(employee.shifts, "requested"),
    fairnessExceptionCount: employer.fairnessExceptions.length,
    fairnessRules: [...employer.fairnessRules],
  };
}
