import {
  appliedResult,
  errorResult,
  previewResult,
  readResult,
  type CapabilityResult,
} from "./capability-result";
import { selectEmployerDashboard, type EmployerDashboard } from "./selectors";
import type {
  ActionSource,
  DemoState,
  DemoStore,
  FairnessReviewState,
  FairnessSeverity,
  OpportunityDraft,
  OpportunityValidation,
  Programme,
  ProgrammeReadiness,
  ProgrammeStatus,
  Shift,
  ShiftStatus,
} from "./types";

const DEMO_DATE = "2026-08-28";
const ELIGIBLE_EMPLOYEE_COUNT = 412;
const EXPECTED_PARTICIPATION_PERCENT = 68;
const ESTIMATED_COST = 70040;
const MAXIMUM_EXPOSURE = 103000;

export type ProgrammeFilter = ProgrammeStatus | "all";
export type FairnessFilter = FairnessSeverity | "all";

export type CreateOpportunityDraftInput = Omit<
  OpportunityDraft,
  "id" | "status"
> & { confirm: boolean };

export interface ProgrammeSummary {
  id: string;
  name: string;
  type: Programme["type"];
  budget: number;
  spent: number;
  remaining: number;
  enrolled: number;
  participating: number;
  participationPercent: number;
  status: ProgrammeStatus;
  readiness: ProgrammeReadiness;
  expiresOn: string | null;
}

export interface EmployerShiftSummary {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  site: string;
  role: string;
  estimatedEarnings: number;
  estimateKind: Shift["estimateKind"];
  deadline: string | null;
  status: ShiftStatus;
  applications: number;
  spots: number;
}

export interface FairnessExceptionSummary {
  id: string;
  employeeLabel: string;
  issue: string;
  programmeName: string;
  severity: FairnessSeverity;
  recordFreshnessHours: number;
  reviewState: FairnessReviewState;
}

export interface EmployerCapabilities {
  getDashboard(): CapabilityResult<EmployerDashboard>;
  listProgrammes(input?: {
    status?: ProgrammeFilter;
  }): CapabilityResult<ProgrammeSummary[]>;
  createOpportunityDraft(
    input: CreateOpportunityDraftInput,
    source?: ActionSource,
  ): CapabilityResult<OpportunityDraft>;
  validateOpportunity(
    input: { draftId: string },
    source?: ActionSource,
  ): CapabilityResult<OpportunityValidation>;
  listOpenShifts(): CapabilityResult<EmployerShiftSummary[]>;
  listFairnessExceptions(input?: {
    severity?: FairnessFilter;
  }): CapabilityResult<FairnessExceptionSummary[]>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function hasOnlyKeys(
  input: Record<string, unknown>,
  allowedKeys: readonly string[],
): boolean {
  return Object.keys(input).every((key) => allowedKeys.includes(key));
}

function isRequiredString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isStrictIsoDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);
  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  );
}

function isPositiveMoney(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function isActionSource(value: unknown): value is ActionSource {
  return value === "ui" || value === "webmcp";
}

function isProgrammeFilter(value: unknown): value is ProgrammeFilter {
  return value === "all" || value === "active" || value === "draft";
}

function isFairnessFilter(value: unknown): value is FairnessFilter {
  return value === "all" || value === "medium" || value === "low";
}

function validProgrammeInput(
  input: unknown,
): input is { status?: ProgrammeFilter } {
  return (
    isRecord(input) &&
    hasOnlyKeys(input, ["status"]) &&
    (!Object.hasOwn(input, "status") || isProgrammeFilter(input.status))
  );
}

function validFairnessInput(
  input: unknown,
): input is { severity?: FairnessFilter } {
  return (
    isRecord(input) &&
    hasOnlyKeys(input, ["severity"]) &&
    (!Object.hasOwn(input, "severity") || isFairnessFilter(input.severity))
  );
}

function validDraftInput(input: unknown): input is CreateOpportunityDraftInput {
  if (
    !isRecord(input) ||
    !hasOnlyKeys(input, [
      "name",
      "type",
      "outcome",
      "eligibleSegment",
      "qualificationRule",
      "startDate",
      "endDate",
      "rewardType",
      "rewardAmount",
      "totalBudget",
      "maxPerEmployee",
      "exceptionPolicy",
      "confirm",
    ])
  ) {
    return false;
  }

  return (
    isRequiredString(input.name) &&
    (input.type === "attendance" ||
      input.type === "learning" ||
      input.type === "extra_shifts") &&
    isRequiredString(input.outcome) &&
    isRequiredString(input.eligibleSegment) &&
    isRequiredString(input.qualificationRule) &&
    isStrictIsoDate(input.startDate) &&
    input.startDate > DEMO_DATE &&
    isStrictIsoDate(input.endDate) &&
    input.endDate >= input.startDate &&
    (input.rewardType === "cash" ||
      input.rewardType === "voucher" ||
      input.rewardType === "credits") &&
    isPositiveMoney(input.rewardAmount) &&
    isPositiveMoney(input.totalBudget) &&
    isPositiveMoney(input.maxPerEmployee) &&
    input.rewardAmount <= input.maxPerEmployee &&
    isRequiredString(input.exceptionPolicy) &&
    typeof input.confirm === "boolean"
  );
}

function validValidationInput(input: unknown): input is { draftId: string } {
  return (
    isRecord(input) &&
    Object.keys(input).length === 1 &&
    Object.hasOwn(input, "draftId") &&
    typeof input.draftId === "string"
  );
}

function programmeSummary(programme: Programme): ProgrammeSummary {
  return {
    id: programme.id,
    name: programme.name,
    type: programme.type,
    budget: programme.budget,
    spent: programme.spent,
    remaining: programme.budget - programme.spent,
    enrolled: programme.enrolled,
    participating: programme.participating,
    participationPercent:
      programme.enrolled === 0
        ? 0
        : Math.round((programme.participating / programme.enrolled) * 100),
    status: programme.status,
    readiness: programme.readiness,
    expiresOn: programme.expiresOn,
  };
}

function openShiftSummary(shift: Shift): EmployerShiftSummary {
  return {
    id: shift.id,
    date: shift.date,
    startTime: shift.startTime,
    endTime: shift.endTime,
    site: shift.site,
    role: shift.role,
    estimatedEarnings: shift.estimatedEarnings,
    estimateKind: shift.estimateKind,
    deadline: shift.deadline,
    status: shift.status,
    applications: shift.applications,
    spots: shift.spots,
  };
}

function fairnessExceptionSummary(exception: {
  id: string;
  employeeLabel: string;
  issue: string;
  programmeName: string;
  severity: FairnessSeverity;
  recordFreshnessHours: number;
  reviewState: FairnessReviewState;
}): FairnessExceptionSummary {
  return { ...exception };
}

function createDraft(input: CreateOpportunityDraftInput): OpportunityDraft {
  return {
    id: "draft-opportunity",
    name: input.name,
    type: input.type,
    outcome: input.outcome,
    eligibleSegment: input.eligibleSegment,
    qualificationRule: input.qualificationRule,
    startDate: input.startDate,
    endDate: input.endDate,
    rewardType: input.rewardType,
    rewardAmount: input.rewardAmount,
    totalBudget: input.totalBudget,
    maxPerEmployee: input.maxPerEmployee,
    exceptionPolicy: input.exceptionPolicy,
    status: "draft",
  };
}

function opportunityValidation(state: DemoState): OpportunityValidation {
  const unresolvedExceptionCount = state.employer.fairnessExceptions.length;
  const fairnessPassed = unresolvedExceptionCount === 0;
  return {
    draftId: "draft-opportunity",
    readiness: fairnessPassed ? "ready" : "review_required",
    rulesClear: true,
    dataAvailable: true,
    dataFresh: true,
    fairnessPassed,
    budgetWithinLimit: true,
    eligibleEmployeeCount: ELIGIBLE_EMPLOYEE_COUNT,
    expectedParticipationPercent: EXPECTED_PARTICIPATION_PERCENT,
    estimatedCost: ESTIMATED_COST,
    maximumExposure: MAXIMUM_EXPOSURE,
    unresolvedExceptionCount,
    issues: fairnessPassed
      ? []
      : [
          `${unresolvedExceptionCount} fairness ${
            unresolvedExceptionCount === 1
              ? "exception requires"
              : "exceptions require"
          } review before launch.`,
        ],
  };
}

export function createEmployerCapabilities(
  store: DemoStore,
): EmployerCapabilities {
  return {
    getDashboard() {
      return readResult(
        "Employer dashboard ready.",
        selectEmployerDashboard(store.getState()),
      );
    },

    listProgrammes(input = {}) {
      if (!validProgrammeInput(input)) {
        return errorResult(
          "INVALID_INPUT",
          "Enter a valid programme status filter.",
          "Use active, draft, or all.",
        );
      }

      const status = input.status ?? "all";
      const programmes = store
        .getState()
        .employer.programmes.filter(
          (programme) => status === "all" || programme.status === status,
        )
        .map(programmeSummary);
      return readResult("Employer programmes ready.", programmes);
    },

    createOpportunityDraft(input, source = "webmcp") {
      if (!validDraftInput(input)) {
        return errorResult(
          "INVALID_INPUT",
          "Enter a complete valid opportunity draft.",
          "Provide every required field, valid dates, and positive budget values.",
        );
      }
      if (!isActionSource(source)) {
        return errorResult(
          "INVALID_INPUT",
          "Enter a valid action source.",
          "Use ui or webmcp.",
        );
      }

      const draft = createDraft(input);
      if (!input.confirm) {
        return previewResult("Opportunity draft ready to confirm.", draft);
      }

      store.dispatch({ type: "employer/save-draft", draft, source });
      return appliedResult("Opportunity draft saved.", draft);
    },

    validateOpportunity(input, source = "webmcp") {
      if (!validValidationInput(input)) {
        return errorResult(
          "INVALID_INPUT",
          "Enter a valid opportunity draft ID.",
          "Provide the active draft ID.",
        );
      }
      if (!isActionSource(source)) {
        return errorResult(
          "INVALID_INPUT",
          "Enter a valid action source.",
          "Use ui or webmcp.",
        );
      }

      const draft = store.getState().employer.activeDraft;
      if (draft === null || draft.id !== input.draftId) {
        return errorResult(
          "NOT_FOUND",
          "That opportunity draft was not found.",
          "Save the draft, then validate its current ID.",
        );
      }
      if (draft.totalBudget < MAXIMUM_EXPOSURE) {
        return errorResult(
          "BUDGET_EXCEEDED",
          "The total budget is below the maximum possible exposure.",
          "Increase the budget to at least R103,000 or reduce eligible reach or the maximum per employee.",
        );
      }

      const validation = opportunityValidation(store.getState());
      store.dispatch({ type: "employer/set-validation", validation, source });
      return appliedResult(
        "Opportunity draft validated for review.",
        validation,
      );
    },

    listOpenShifts() {
      const shifts = store
        .getState()
        .employee.shifts.filter((shift) => shift.status !== "confirmed")
        .map(openShiftSummary);
      return readResult("Open shift operations ready.", shifts);
    },

    listFairnessExceptions(input = {}) {
      if (!validFairnessInput(input)) {
        return errorResult(
          "INVALID_INPUT",
          "Enter a valid fairness severity filter.",
          "Use medium, low, or all.",
        );
      }

      const severity = input.severity ?? "all";
      const exceptions = store
        .getState()
        .employer.fairnessExceptions.filter(
          (exception) => severity === "all" || exception.severity === severity,
        )
        .map(fairnessExceptionSummary);
      return readResult("Fairness exceptions ready for review.", exceptions);
    },
  };
}
