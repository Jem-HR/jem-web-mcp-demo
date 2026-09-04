import { describe, expect, it } from "vitest";

import {
  createEmployeeCapabilities,
  type EmployeeCapabilities,
} from "../demo/employee-capabilities";
import { errorResult } from "../demo/capability-result";
import { createDemoStore } from "../demo/store";
import { createEmployeeTools } from "./employee-tools";

const INVALID_INPUT = {
  ok: false,
  status: "error",
  error: {
    code: "INVALID_INPUT",
    message: "The tool input is invalid.",
    recovery: "Use the tool schema and provide only documented fields.",
  },
};

const goalInput = {
  name: "December Fund",
  targetAmount: 8000,
  savedAmount: 2520,
  targetDate: "2026-12-01",
  monthlyContribution: 500,
  isPrivate: true,
  confirm: false,
};

function toolByName(
  tools: readonly WebMCP.ModelContextTool[],
  name: string,
): WebMCP.ModelContextTool {
  const tool = tools.find((candidate) => candidate.name === name);
  if (tool === undefined) throw new Error(`Missing ${name}.`);
  return tool;
}

function executeTool(tool: WebMCP.ModelContextTool, input: unknown) {
  return tool.execute(input as Record<string, unknown>, {
    signal: new AbortController().signal,
  });
}

function customPrototypeInput(input: Record<string, unknown>) {
  class Input {}
  return Object.assign(new Input(), input);
}

describe("createEmployeeTools", () => {
  it("declares the approved employee tool order, annotations, and closed schemas", () => {
    const tools = createEmployeeTools(
      createEmployeeCapabilities(createDemoStore()),
    );

    expect(
      tools.map((tool) => ({
        name: tool.name,
        title: tool.title,
        annotations: tool.annotations,
        inputSchema: tool.inputSchema,
      })),
    ).toEqual([
      {
        name: "get_employee_dashboard",
        title: "Get employee dashboard",
        annotations: { readOnlyHint: true },
        inputSchema: {
          type: "object",
          properties: {},
          required: [],
          additionalProperties: false,
        },
      },
      {
        name: "update_savings_goal",
        title: "Update savings goal",
        annotations: { readOnlyHint: false },
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
      },
      {
        name: "list_employee_opportunities",
        title: "List employee opportunities",
        annotations: { readOnlyHint: true },
        inputSchema: {
          type: "object",
          properties: {
            category: {
              type: "string",
              enum: ["all", "shift", "learning", "reward"],
            },
          },
          required: [],
          additionalProperties: false,
        },
      },
      {
        name: "request_shift",
        title: "Request shift",
        annotations: { readOnlyHint: false },
        inputSchema: {
          type: "object",
          properties: {
            shiftId: { type: "string", minLength: 1 },
            confirm: { type: "boolean" },
          },
          required: ["shiftId", "confirm"],
          additionalProperties: false,
        },
      },
      {
        name: "allocate_reward",
        title: "Allocate reward",
        annotations: { readOnlyHint: false },
        inputSchema: {
          type: "object",
          properties: {
            rewardId: { type: "string", minLength: 1 },
            destination: { type: "string", enum: ["savings", "voucher"] },
            confirm: { type: "boolean" },
          },
          required: ["rewardId", "destination", "confirm"],
          additionalProperties: false,
        },
      },
    ]);

    expect(toolByName(tools, "get_employee_dashboard").description).toContain(
      "private employee information",
    );
    expect(toolByName(tools, "update_savings_goal").description).toContain(
      "private employee information",
    );
    for (const name of [
      "update_savings_goal",
      "request_shift",
      "allocate_reward",
    ]) {
      const description = toolByName(tools, name).description;
      expect(description).toContain("confirm:false");
      expect(description).toContain("confirm:true");
      expect(description).toContain("explicit user confirmation");
    }
  });

  it("declares closed employee schemas and updates the live store only after confirmation", async () => {
    const store = createDemoStore();
    const tools = createEmployeeTools(createEmployeeCapabilities(store));
    for (const tool of tools)
      expect(tool.inputSchema).toMatchObject({
        type: "object",
        additionalProperties: false,
      });
    const requestShift = toolByName(tools, "request_shift");

    await expect(
      executeTool(requestShift, {
        shiftId: "shift-sat-rosebank",
        confirm: false,
      }),
    ).resolves.toEqual({
      ok: true,
      status: "preview",
      summary: "Shift request ready to confirm.",
      warnings: [
        "This records a request only; it does not assign the shift or guarantee earnings.",
      ],
      data: {
        shiftId: "shift-sat-rosebank",
        status: "requested",
        date: "2026-09-05",
        startTime: "08:00",
        endTime: "17:00",
        hours: 9,
        site: "Rosebank Mall",
        eligibility: "Active Pick n Pay retail employee at the listed site",
        deadline: "2026-09-04",
        estimatedEarnings: 480,
        estimateKind: "estimated_before_deductions",
        alreadyRequested: false,
      },
    });
    expect(
      store
        .getState()
        .employee.shifts.find((shift) => shift.id === "shift-sat-rosebank")
        ?.status,
    ).toBe("available");
    await expect(
      executeTool(requestShift, {
        shiftId: "shift-sat-rosebank",
        confirm: true,
      }),
    ).resolves.toMatchObject({ ok: true, status: "applied" });
    expect(
      store
        .getState()
        .employee.shifts.find((shift) => shift.id === "shift-sat-rosebank")
        ?.status,
    ).toBe("requested");
  });

  it("returns a fixed invalid-input result for every runtime schema bypass", async () => {
    const tools = createEmployeeTools(
      createEmployeeCapabilities(createDemoStore()),
    );
    const cases: ReadonlyArray<readonly [string, unknown[]]> = [
      [
        "get_employee_dashboard",
        [null, { extra: true }, customPrototypeInput({})],
      ],
      [
        "update_savings_goal",
        [
          { ...goalInput, confirm: undefined },
          { ...goalInput, extra: true },
          customPrototypeInput(goalInput),
          { ...goalInput, targetAmount: Number.NaN },
          { ...goalInput, savedAmount: Number.POSITIVE_INFINITY },
        ],
      ],
      [
        "list_employee_opportunities",
        [
          { category: "unknown" },
          { category: 1 },
          { extra: true },
          customPrototypeInput({}),
        ],
      ],
      [
        "request_shift",
        [
          { shiftId: "shift-sat-rosebank" },
          { shiftId: "shift-sat-rosebank", confirm: true, extra: true },
          customPrototypeInput({
            shiftId: "shift-sat-rosebank",
            confirm: true,
          }),
          { shiftId: 4, confirm: true },
          { shiftId: "shift-sat-rosebank", confirm: "true" },
        ],
      ],
      [
        "allocate_reward",
        [
          { rewardId: "reward-safety", destination: "savings" },
          { rewardId: "reward-safety", destination: "cash", confirm: true },
          customPrototypeInput({
            rewardId: "reward-safety",
            destination: "savings",
            confirm: true,
          }),
          { rewardId: 4, destination: "savings", confirm: true },
          { rewardId: "reward-safety", destination: "savings", confirm: 1 },
        ],
      ],
    ];

    for (const [name, inputs] of cases) {
      const tool = toolByName(tools, name);
      for (const input of inputs) {
        await expect(executeTool(tool, input)).resolves.toEqual(INVALID_INPUT);
      }
    }
  });

  it("leaves domain-invalid, correctly typed values to the capability", async () => {
    const tools = createEmployeeTools(
      createEmployeeCapabilities(createDemoStore()),
    );
    const updateGoal = toolByName(tools, "update_savings_goal");
    const requestShift = toolByName(tools, "request_shift");
    const allocateReward = toolByName(tools, "allocate_reward");

    await expect(
      executeTool(updateGoal, { ...goalInput, targetAmount: -1 }),
    ).resolves.toMatchObject({ ok: false, error: { code: "INVALID_INPUT" } });
    await expect(
      executeTool(updateGoal, { ...goalInput, savedAmount: 9000 }),
    ).resolves.toMatchObject({ ok: false, error: { code: "INVALID_INPUT" } });
    await expect(
      executeTool(updateGoal, { ...goalInput, targetDate: "2026-02-30" }),
    ).resolves.toMatchObject({ ok: false, error: { code: "INVALID_INPUT" } });
    await expect(
      executeTool(requestShift, { shiftId: "missing", confirm: true }),
    ).resolves.toMatchObject({ ok: false, error: { code: "NOT_FOUND" } });
    await expect(
      executeTool(allocateReward, {
        rewardId: "reward-reliability",
        destination: "savings",
        confirm: true,
      }),
    ).resolves.toMatchObject({
      ok: false,
      error: { code: "REWARD_NOT_EARNED" },
    });
  });

  it("uses the current dashboard emoji and preserves a dashboard failure unchanged", async () => {
    const store = createDemoStore();
    const tools = createEmployeeTools(createEmployeeCapabilities(store));

    await expect(
      executeTool(toolByName(tools, "update_savings_goal"), {
        ...goalInput,
        confirm: true,
      }),
    ).resolves.toMatchObject({ ok: true, status: "applied" });
    expect(store.getState().employee.goal.emoji).toBe("🎓");

    const dashboardFailure = errorResult(
      "STALE_STATE",
      "Dashboard temporarily unavailable.",
      "Try again shortly.",
    );
    const failingCapabilities: EmployeeCapabilities = {
      getDashboard: () => dashboardFailure,
      updateSavingsGoal: () => {
        throw new Error("goal update must not run after dashboard failure");
      },
      updateExpenses: () => dashboardFailure,
      completeOnboardingPlan: () => dashboardFailure,
      listOpportunities: () => dashboardFailure,
      requestShift: () => dashboardFailure,
      allocateReward: () => dashboardFailure,
    };

    await expect(
      executeTool(
        toolByName(
          createEmployeeTools(failingCapabilities),
          "update_savings_goal",
        ),
        goalInput,
      ),
    ).resolves.toBe(dashboardFailure);
  });

  it("previews without changing state, then applies idempotent employee workflows to the shared store", async () => {
    const store = createDemoStore();
    const tools = createEmployeeTools(createEmployeeCapabilities(store));
    const updateGoal = toolByName(tools, "update_savings_goal");
    const requestShift = toolByName(tools, "request_shift");
    const allocateReward = toolByName(tools, "allocate_reward");
    const dashboard = toolByName(tools, "get_employee_dashboard");
    const opportunities = toolByName(tools, "list_employee_opportunities");
    const initialState = structuredClone(store.getState());

    await expect(executeTool(updateGoal, goalInput)).resolves.toMatchObject({
      ok: true,
      status: "preview",
      warnings: [
        "This changes private employee demo data only; it does not move money.",
      ],
    });
    await expect(
      executeTool(requestShift, {
        shiftId: "shift-sat-rosebank",
        confirm: false,
      }),
    ).resolves.toMatchObject({
      ok: true,
      status: "preview",
      warnings: [
        "This records a request only; it does not assign the shift or guarantee earnings.",
      ],
    });
    await expect(
      executeTool(allocateReward, {
        rewardId: "reward-safety",
        destination: "savings",
        confirm: false,
      }),
    ).resolves.toMatchObject({
      ok: true,
      status: "preview",
      warnings: [
        "This changes only the local demo allocation; it does not issue a reward or move money.",
      ],
    });
    expect(store.getState()).toEqual(initialState);

    await expect(
      executeTool(updateGoal, { ...goalInput, confirm: true }),
    ).resolves.toMatchObject({ ok: true, status: "applied" });
    expect(store.getState().employee.goal).toMatchObject({
      name: "December Fund",
      emoji: "🎓",
    });
    expect(store.getState().activity?.source).toBe("webmcp");

    await expect(
      executeTool(requestShift, {
        shiftId: "shift-sat-rosebank",
        confirm: true,
      }),
    ).resolves.toMatchObject({
      ok: true,
      status: "applied",
      data: { alreadyRequested: false },
    });
    await expect(
      executeTool(requestShift, {
        shiftId: "shift-sat-rosebank",
        confirm: true,
      }),
    ).resolves.toMatchObject({
      ok: true,
      status: "applied",
      data: { alreadyRequested: true },
    });

    await expect(
      executeTool(allocateReward, {
        rewardId: "reward-safety",
        destination: "savings",
        confirm: true,
      }),
    ).resolves.toMatchObject({
      ok: true,
      status: "applied",
      data: { goalSavedAmount: 2670 },
    });
    expect(store.getState().employee.goal.savedAmount).toBe(2670);
    expect(
      store
        .getState()
        .employee.rewards.find((reward) => reward.id === "reward-safety"),
    ).toMatchObject({ status: "allocated", allocatedTo: "savings" });
    expect(store.getState().activity?.source).toBe("webmcp");

    await expect(executeTool(dashboard, {})).resolves.toMatchObject({
      ok: true,
      status: "read",
      data: {
        goal: { name: "December Fund", savedAmount: 2670 },
        requestedShiftCount: 2,
        rewardSummary: { allocated: 1 },
      },
    });
    await expect(
      executeTool(opportunities, { category: "shift" }),
    ).resolves.toMatchObject({
      ok: true,
      status: "read",
      data: expect.arrayContaining([
        expect.objectContaining({
          id: "shift-sat-rosebank",
          state: "requested",
        }),
      ]),
    });
  });
});
