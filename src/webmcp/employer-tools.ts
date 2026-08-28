import type { EmployerCapabilities } from "../demo/employer-capabilities";
import {
  assertBoolean,
  assertClosedObject,
  assertEnum,
  assertFiniteNumber,
  assertString,
  safeToolExecute,
} from "./tool-helpers";

function assertIsoCalendarDate(value: unknown, toolName: string): string {
  const date = assertString(value, toolName);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new TypeError(`${toolName} received invalid input.`);
  }

  const parsed = new Date(`${date}T00:00:00.000Z`);
  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== date
  ) {
    throw new TypeError(`${toolName} received invalid input.`);
  }

  return date;
}

function createGetEmployerDashboardTool(
  capabilities: EmployerCapabilities,
): WebMCP.ModelContextTool {
  const name = "get_employer_dashboard";

  return {
    name,
    title: "Get employer dashboard",
    description:
      "Read aggregate employer dashboard information with anonymised workforce measures and no employee financial details.",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true },
    async execute(input) {
      return safeToolExecute(() => {
        assertClosedObject(input, [], name);
        return capabilities.getDashboard();
      });
    },
  };
}

function createListProgrammesTool(
  capabilities: EmployerCapabilities,
): WebMCP.ModelContextTool {
  const name = "list_programmes";
  const statuses = ["all", "active", "draft"] as const;

  return {
    name,
    title: "List programmes",
    description:
      "Read aggregate, anonymised programme operations and no employee financial details.",
    inputSchema: {
      type: "object",
      properties: {
        status: { type: "string", enum: statuses },
      },
      required: [],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true },
    async execute(input) {
      return safeToolExecute(() => {
        const parsed = assertClosedObject(input, ["status"], name);
        if (!Object.hasOwn(parsed, "status")) {
          return capabilities.listProgrammes();
        }

        return capabilities.listProgrammes({
          status: assertEnum(parsed.status, statuses, name),
        });
      });
    },
  };
}

function createCreateOpportunityDraftTool(
  capabilities: EmployerCapabilities,
): WebMCP.ModelContextTool {
  const name = "create_opportunity_draft";
  const types = ["attendance", "learning", "extra_shifts"] as const;
  const rewardTypes = ["cash", "voucher", "credits"] as const;
  const keys = [
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
  ] as const;

  return {
    name,
    title: "Create opportunity draft",
    description:
      "Create an aggregate, anonymised opportunity draft with no employee financial details. confirm:false creates a preview; save only after explicit confirmation. This tool cannot launch a programme.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", minLength: 1 },
        type: { type: "string", enum: types },
        outcome: { type: "string", minLength: 1 },
        eligibleSegment: { type: "string", minLength: 1 },
        qualificationRule: { type: "string", minLength: 1 },
        startDate: { type: "string", format: "date" },
        endDate: { type: "string", format: "date" },
        rewardType: { type: "string", enum: rewardTypes },
        rewardAmount: { type: "number", exclusiveMinimum: 0 },
        totalBudget: { type: "number", exclusiveMinimum: 0 },
        maxPerEmployee: { type: "number", exclusiveMinimum: 0 },
        exceptionPolicy: { type: "string", minLength: 1 },
        confirm: { type: "boolean" },
      },
      required: keys,
      additionalProperties: false,
    },
    annotations: { readOnlyHint: false },
    async execute(input) {
      return safeToolExecute(() => {
        const parsed = assertClosedObject(input, keys, name);
        return capabilities.createOpportunityDraft(
          {
            name: assertString(parsed.name, name),
            type: assertEnum(parsed.type, types, name),
            outcome: assertString(parsed.outcome, name),
            eligibleSegment: assertString(parsed.eligibleSegment, name),
            qualificationRule: assertString(parsed.qualificationRule, name),
            startDate: assertIsoCalendarDate(parsed.startDate, name),
            endDate: assertIsoCalendarDate(parsed.endDate, name),
            rewardType: assertEnum(parsed.rewardType, rewardTypes, name),
            rewardAmount: assertFiniteNumber(parsed.rewardAmount, name),
            totalBudget: assertFiniteNumber(parsed.totalBudget, name),
            maxPerEmployee: assertFiniteNumber(parsed.maxPerEmployee, name),
            exceptionPolicy: assertString(parsed.exceptionPolicy, name),
            confirm: assertBoolean(parsed.confirm, name),
          },
          "webmcp",
        );
      });
    },
  };
}

function createValidateOpportunityTool(
  capabilities: EmployerCapabilities,
): WebMCP.ModelContextTool {
  const name = "validate_opportunity";

  return {
    name,
    title: "Validate opportunity",
    description:
      "Run aggregate, anonymised local analysis with no employee financial details. It updates local validation state, but cannot launch or approve a programme and cannot resolve fairness exceptions.",
    inputSchema: {
      type: "object",
      properties: {
        draftId: { type: "string", minLength: 1 },
      },
      required: ["draftId"],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: false },
    async execute(input) {
      return safeToolExecute(() => {
        const parsed = assertClosedObject(input, ["draftId"], name);
        return capabilities.validateOpportunity(
          { draftId: assertString(parsed.draftId, name) },
          "webmcp",
        );
      });
    },
  };
}

function createListOpenShiftsTool(
  capabilities: EmployerCapabilities,
): WebMCP.ModelContextTool {
  const name = "list_open_shifts";

  return {
    name,
    title: "List open shifts",
    description:
      "Read aggregate, anonymised open-shift operations and no employee financial details.",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true },
    async execute(input) {
      return safeToolExecute(() => {
        assertClosedObject(input, [], name);
        return capabilities.listOpenShifts();
      });
    },
  };
}

function createListFairnessExceptionsTool(
  capabilities: EmployerCapabilities,
): WebMCP.ModelContextTool {
  const name = "list_fairness_exceptions";
  const severities = ["all", "medium", "low"] as const;

  return {
    name,
    title: "List fairness exceptions",
    description:
      "Read anonymised fairness exceptions in aggregate with no employee financial details.",
    inputSchema: {
      type: "object",
      properties: {
        severity: { type: "string", enum: severities },
      },
      required: [],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true },
    async execute(input) {
      return safeToolExecute(() => {
        const parsed = assertClosedObject(input, ["severity"], name);
        if (!Object.hasOwn(parsed, "severity")) {
          return capabilities.listFairnessExceptions();
        }

        return capabilities.listFairnessExceptions({
          severity: assertEnum(parsed.severity, severities, name),
        });
      });
    },
  };
}

export function createEmployerTools(
  capabilities: EmployerCapabilities,
): readonly WebMCP.ModelContextTool[] {
  return [
    createGetEmployerDashboardTool(capabilities),
    createListProgrammesTool(capabilities),
    createCreateOpportunityDraftTool(capabilities),
    createValidateOpportunityTool(capabilities),
    createListOpenShiftsTool(capabilities),
    createListFairnessExceptionsTool(capabilities),
  ] satisfies readonly WebMCP.ModelContextTool[];
}
