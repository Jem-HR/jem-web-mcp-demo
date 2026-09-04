import type { EmployeeCapabilities } from "../demo/employee-capabilities";
import {
  assertBoolean,
  assertClosedObject,
  assertEnum,
  assertFiniteNumber,
  assertString,
  safeToolExecute,
} from "./tool-helpers";

function createGetEmployeeDashboardTool(
  capabilities: EmployeeCapabilities,
): WebMCP.ModelContextTool {
  const name = "get_employee_dashboard";

  return {
    name,
    title: "Get employee dashboard",
    description:
      "Read private employee information from the current dashboard without changing anything.",
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

function createUpdateSavingsGoalTool(
  capabilities: EmployeeCapabilities,
): WebMCP.ModelContextTool {
  const name = "update_savings_goal";

  return {
    name,
    title: "Update savings goal",
    description:
      "Read and prepare an update to private employee information for a savings goal. confirm:false previews without mutation; set confirm:true only after explicit user confirmation to apply it.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", minLength: 1 },
        targetAmount: { type: "number", exclusiveMinimum: 0 },
        savedAmount: { type: "number", minimum: 0 },
        targetDate: { type: "string", format: "date" },
        monthlyContribution: { type: "number", minimum: 0 },
        isPrivate: { type: "boolean" },
        confirm: { type: "boolean" },
      },
      required: [
        "name",
        "targetAmount",
        "savedAmount",
        "targetDate",
        "monthlyContribution",
        "isPrivate",
        "confirm",
      ],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: false },
    async execute(input) {
      return safeToolExecute(() => {
        const parsed = assertClosedObject(
          input,
          [
            "name",
            "targetAmount",
            "savedAmount",
            "targetDate",
            "monthlyContribution",
            "isPrivate",
            "confirm",
          ],
          name,
        );
        const goalName = assertString(parsed.name, name);
        const targetAmount = assertFiniteNumber(parsed.targetAmount, name);
        const savedAmount = assertFiniteNumber(parsed.savedAmount, name);
        const targetDate = assertString(parsed.targetDate, name);
        const monthlyContribution = assertFiniteNumber(
          parsed.monthlyContribution,
          name,
        );
        const isPrivate = assertBoolean(parsed.isPrivate, name);
        const confirm = assertBoolean(parsed.confirm, name);
        const dashboard = capabilities.getDashboard();

        if (!dashboard.ok) return dashboard;

        return capabilities.updateSavingsGoal(
          {
            name: goalName,
            emoji: dashboard.data.goal.emoji,
            targetAmount,
            savedAmount,
            targetDate,
            monthlyContribution,
            isPrivate,
            confirm,
          },
          "webmcp",
        );
      });
    },
  };
}

function createListEmployeeOpportunitiesTool(
  capabilities: EmployeeCapabilities,
): WebMCP.ModelContextTool {
  const name = "list_employee_opportunities";
  const categories = ["all", "shift", "learning", "reward"] as const;

  return {
    name,
    title: "List employee opportunities",
    description:
      "Read the available employee shifts, learning and reward opportunities without changing anything.",
    inputSchema: {
      type: "object",
      properties: {
        category: { type: "string", enum: categories },
      },
      required: [],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true },
    async execute(input) {
      return safeToolExecute(() => {
        const parsed = assertClosedObject(input, ["category"], name);
        if (!Object.hasOwn(parsed, "category")) {
          return capabilities.listOpportunities();
        }

        return capabilities.listOpportunities({
          category: assertEnum(parsed.category, categories, name),
        });
      });
    },
  };
}

function createRequestShiftTool(
  capabilities: EmployeeCapabilities,
): WebMCP.ModelContextTool {
  const name = "request_shift";

  return {
    name,
    title: "Request shift",
    description:
      "Prepare a request for an available employee shift. confirm:false previews without mutation; set confirm:true only after explicit user confirmation to apply it.",
    inputSchema: {
      type: "object",
      properties: {
        shiftId: { type: "string", minLength: 1 },
        confirm: { type: "boolean" },
      },
      required: ["shiftId", "confirm"],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: false },
    async execute(input) {
      return safeToolExecute(() => {
        const parsed = assertClosedObject(input, ["shiftId", "confirm"], name);
        return capabilities.requestShift(
          {
            shiftId: assertString(parsed.shiftId, name),
            confirm: assertBoolean(parsed.confirm, name),
          },
          "webmcp",
        );
      });
    },
  };
}

function createAllocateRewardTool(
  capabilities: EmployeeCapabilities,
): WebMCP.ModelContextTool {
  const name = "allocate_reward";
  const destinations = ["savings", "voucher"] as const;

  return {
    name,
    title: "Allocate reward",
    description:
      "Prepare an earned employee reward allocation to savings or a voucher. confirm:false previews without mutation; set confirm:true only after explicit user confirmation to apply it.",
    inputSchema: {
      type: "object",
      properties: {
        rewardId: { type: "string", minLength: 1 },
        destination: { type: "string", enum: destinations },
        confirm: { type: "boolean" },
      },
      required: ["rewardId", "destination", "confirm"],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: false },
    async execute(input) {
      return safeToolExecute(() => {
        const parsed = assertClosedObject(
          input,
          ["rewardId", "destination", "confirm"],
          name,
        );
        return capabilities.allocateReward(
          {
            rewardId: assertString(parsed.rewardId, name),
            destination: assertEnum(parsed.destination, destinations, name),
            confirm: assertBoolean(parsed.confirm, name),
          },
          "webmcp",
        );
      });
    },
  };
}

export function createEmployeeTools(
  capabilities: EmployeeCapabilities,
): readonly WebMCP.ModelContextTool[] {
  return [
    createGetEmployeeDashboardTool(capabilities),
    createUpdateSavingsGoalTool(capabilities),
    createListEmployeeOpportunitiesTool(capabilities),
    createRequestShiftTool(capabilities),
    createAllocateRewardTool(capabilities),
  ] satisfies readonly WebMCP.ModelContextTool[];
}
