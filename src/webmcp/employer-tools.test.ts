import { describe, expect, it } from "vitest";

import { createDemoCapabilities } from "../demo/capabilities";
import { createInitialDemoState } from "../demo/fixtures";
import { createDemoStore } from "../demo/store";
import { createEmployerTools } from "./employer-tools";

const STALE_STATE = {
  ok: false,
  status: "error",
  error: {
    code: "STALE_STATE",
    message: "The demo could not complete that action.",
    recovery: "Refresh or reset the demo and try again.",
  },
};

const validDraft = {
  name: "October Reliability Reward",
  type: "attendance" as const,
  outcome: "Reward on-time attendance during October",
  eligibleSegment: "Rosebank retail employees",
  qualificationRule: "Arrive on time for every confirmed October shift",
  startDate: "2026-10-01",
  endDate: "2026-10-31",
  rewardType: "cash" as const,
  rewardAmount: 250,
  totalBudget: 105000,
  maxPerEmployee: 250,
  exceptionPolicy: "Approved leave and roster changes enter review",
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

const protectedKeys = new Set([
  "goal",
  "expenses",
  "emoji",
  "targetAmount",
  "savedAmount",
  "targetDate",
  "monthlyContribution",
  "isPrivate",
  "housing",
  "transport",
  "food",
  "dependants",
  "debt",
  "airtime",
  "other",
]);

function protectedPaths(value: unknown, path: string[] = []): string[] {
  if (value === null || typeof value !== "object") return [];

  return Object.entries(value).flatMap(([key, child]) => {
    const childPath = [...path, key];
    const keyIsProtected =
      protectedKeys.has(key) || (key === "name" && path.includes("goal"));
    return [
      ...(keyIsProtected ? [childPath.join(".")] : []),
      ...protectedPaths(child, childPath),
    ];
  });
}

describe("createEmployerTools", () => {
  it("declares the approved employer order, annotations, descriptions, and exact closed schemas", () => {
    const tools = createEmployerTools(
      createDemoCapabilities(createDemoStore()).employer,
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
        name: "get_employer_dashboard",
        title: "Get employer dashboard",
        annotations: { readOnlyHint: true },
        inputSchema: {
          type: "object",
          properties: {},
          required: [],
          additionalProperties: false,
        },
      },
      {
        name: "list_programmes",
        title: "List programmes",
        annotations: { readOnlyHint: true },
        inputSchema: {
          type: "object",
          properties: {
            status: { type: "string", enum: ["all", "active", "draft"] },
          },
          required: [],
          additionalProperties: false,
        },
      },
      {
        name: "create_opportunity_draft",
        title: "Create opportunity draft",
        annotations: { readOnlyHint: false },
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string", minLength: 1 },
            type: {
              type: "string",
              enum: ["attendance", "learning", "extra_shifts"],
            },
            outcome: { type: "string", minLength: 1 },
            eligibleSegment: { type: "string", minLength: 1 },
            qualificationRule: { type: "string", minLength: 1 },
            startDate: { type: "string", format: "date" },
            endDate: { type: "string", format: "date" },
            rewardType: {
              type: "string",
              enum: ["cash", "voucher", "credits"],
            },
            rewardAmount: { type: "number", exclusiveMinimum: 0 },
            totalBudget: { type: "number", exclusiveMinimum: 0 },
            maxPerEmployee: { type: "number", exclusiveMinimum: 0 },
            exceptionPolicy: { type: "string", minLength: 1 },
            confirm: { type: "boolean" },
          },
          required: [
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
          ],
          additionalProperties: false,
        },
      },
      {
        name: "validate_opportunity",
        title: "Validate opportunity",
        annotations: { readOnlyHint: false },
        inputSchema: {
          type: "object",
          properties: { draftId: { type: "string", minLength: 1 } },
          required: ["draftId"],
          additionalProperties: false,
        },
      },
      {
        name: "list_open_shifts",
        title: "List open shifts",
        annotations: { readOnlyHint: true },
        inputSchema: {
          type: "object",
          properties: {},
          required: [],
          additionalProperties: false,
        },
      },
      {
        name: "list_fairness_exceptions",
        title: "List fairness exceptions",
        annotations: { readOnlyHint: true },
        inputSchema: {
          type: "object",
          properties: {
            severity: { type: "string", enum: ["all", "medium", "low"] },
          },
          required: [],
          additionalProperties: false,
        },
      },
    ]);

    for (const tool of tools) {
      expect(tool.description).toMatch(/aggregate|anonymised/i);
      expect(tool.description).toMatch(/no employee financial details/i);
    }
    expect(toolByName(tools, "create_opportunity_draft").description).toMatch(
      /preview.*explicit confirmation.*cannot launch/i,
    );
    expect(toolByName(tools, "validate_opportunity").description).toMatch(
      /local analysis.*updates local validation state.*cannot launch or approve.*cannot resolve fairness exceptions/i,
    );
  });

  it("returns fixed stale state for unknown keys, invalid shapes, fields, enums, dates, and non-finite numbers", async () => {
    const tools = createEmployerTools(
      createDemoCapabilities(createDemoStore()).employer,
    );
    const cases: ReadonlyArray<readonly [string, unknown[]]> = [
      [
        "get_employer_dashboard",
        [null, [], true, { extra: true }, customPrototypeInput({})],
      ],
      [
        "list_programmes",
        [
          "all",
          [],
          { extra: true },
          { status: "closed" },
          { status: 1 },
          customPrototypeInput({ status: "all" }),
        ],
      ],
      [
        "create_opportunity_draft",
        [
          null,
          [],
          { ...validDraft, name: "" },
          { ...validDraft, type: "reward" },
          { ...validDraft, rewardType: "points" },
          { ...validDraft, startDate: "2026-02-30" },
          { ...validDraft, endDate: "31-10-2026" },
          { ...validDraft, rewardAmount: Number.NaN },
          { ...validDraft, totalBudget: Number.POSITIVE_INFINITY },
          { ...validDraft, maxPerEmployee: "250" },
          { ...validDraft, confirm: "false" },
          { ...validDraft, extra: true },
          customPrototypeInput(validDraft),
          Object.fromEntries(
            Object.entries(validDraft).filter(([key]) => key !== "outcome"),
          ),
        ],
      ],
      [
        "validate_opportunity",
        [
          null,
          [],
          {},
          { draftId: "" },
          { draftId: 4 },
          { draftId: "x", extra: true },
        ],
      ],
      ["list_open_shifts", [undefined, [], { extra: true }]],
      [
        "list_fairness_exceptions",
        [1, [], { severity: "high" }, { severity: false }, { extra: true }],
      ],
    ];

    for (const [name, inputs] of cases) {
      const tool = toolByName(tools, name);
      for (const input of inputs) {
        await expect(executeTool(tool, input)).resolves.toEqual(STALE_STATE);
      }
    }
  });

  it("preserves correctly typed domain errors and applies confirmed workflows with webmcp provenance", async () => {
    const store = createDemoStore();
    const tools = createEmployerTools(createDemoCapabilities(store).employer);
    const createDraft = toolByName(tools, "create_opportunity_draft");
    const validate = toolByName(tools, "validate_opportunity");

    await expect(
      executeTool(toolByName(tools, "list_programmes"), { status: "draft" }),
    ).resolves.toMatchObject({
      ok: true,
      data: [{ id: "programme-open-shifts" }],
    });
    await expect(
      executeTool(toolByName(tools, "list_fairness_exceptions"), {
        severity: "low",
      }),
    ).resolves.toMatchObject({
      ok: true,
      data: [{ id: "exception-missing-leave" }],
    });

    for (const input of [
      { ...validDraft, startDate: "2026-08-01" },
      { ...validDraft, endDate: "2026-09-01" },
      { ...validDraft, rewardAmount: 0 },
      { ...validDraft, rewardAmount: 300, maxPerEmployee: 250 },
    ]) {
      await expect(executeTool(createDraft, input)).resolves.toMatchObject({
        ok: false,
        error: { code: "INVALID_INPUT" },
      });
    }
    await expect(
      executeTool(validate, { draftId: "missing" }),
    ).resolves.toMatchObject({ ok: false, error: { code: "NOT_FOUND" } });

    await expect(executeTool(createDraft, validDraft)).resolves.toMatchObject({
      ok: true,
      status: "preview",
    });
    expect(store.getState().employer.activeDraft).toBeNull();
    await expect(
      executeTool(createDraft, { ...validDraft, confirm: true }),
    ).resolves.toMatchObject({ ok: true, status: "applied" });
    expect(store.getState().activity?.source).toBe("webmcp");
    await expect(
      executeTool(validate, { draftId: "draft-opportunity" }),
    ).resolves.toMatchObject({ ok: true, status: "applied" });
    expect(store.getState().employer.validation?.readiness).toBe(
      "review_required",
    );
    expect(store.getState().activity?.source).toBe("webmcp");

    const blockedStore = createDemoStore();
    const blockedTools = createEmployerTools(
      createDemoCapabilities(blockedStore).employer,
    );
    await executeTool(toolByName(blockedTools, "create_opportunity_draft"), {
      ...validDraft,
      totalBudget: 50000,
      confirm: true,
    });
    await expect(
      executeTool(toolByName(blockedTools, "validate_opportunity"), {
        draftId: "draft-opportunity",
      }),
    ).resolves.toMatchObject({
      ok: false,
      error: { code: "BUDGET_EXCEEDED" },
    });
  });

  it("keeps protected employee values out of all six employer tool results", async () => {
    const initial = createInitialDemoState();
    const store = createDemoStore({
      ...initial,
      employee: {
        ...initial.employee,
        goal: {
          name: "Protected Goal Sentinel Gamma",
          emoji: "🕵️",
          targetAmount: 987654321,
          savedAmount: 876543219,
          targetDate: "2047-11-29",
          monthlyContribution: 765432109,
          isPrivate: true,
        },
        expenses: {
          housing: 654321987,
          transport: 543219876,
          food: 432198765,
          dependants: 321987654,
          debt: 219876543,
          airtime: 198765432,
          other: 187654329,
        },
      },
    });
    const tools = createEmployerTools(createDemoCapabilities(store).employer);
    const createDraft = toolByName(tools, "create_opportunity_draft");
    const payloads = [
      await executeTool(toolByName(tools, "get_employer_dashboard"), {}),
      await executeTool(toolByName(tools, "list_programmes"), {}),
      await executeTool(createDraft, validDraft),
      await executeTool(createDraft, { ...validDraft, confirm: true }),
      await executeTool(toolByName(tools, "validate_opportunity"), {
        draftId: "draft-opportunity",
      }),
      await executeTool(toolByName(tools, "list_open_shifts"), {}),
      await executeTool(toolByName(tools, "list_fairness_exceptions"), {}),
    ];
    const serialised = JSON.stringify(payloads);

    expect(payloads.flatMap((payload) => protectedPaths(payload))).toEqual([]);
    expect(serialised).not.toContain(
      JSON.stringify(store.getState().employee.goal),
    );
    expect(serialised).not.toContain(
      JSON.stringify(store.getState().employee.expenses),
    );
    for (const protectedValue of [
      "Protected Goal Sentinel Gamma",
      "🕵️",
      "2047-11-29",
    ]) {
      expect(serialised).not.toContain(protectedValue);
    }
    for (const protectedNumber of [
      987654321, 876543219, 765432109, 654321987, 543219876, 432198765,
      321987654, 219876543, 198765432, 187654329,
    ]) {
      for (const protectedRendering of [
        String(protectedNumber),
        new Intl.NumberFormat("en-ZA").format(protectedNumber),
        new Intl.NumberFormat("en-ZA", {
          style: "currency",
          currency: "ZAR",
        }).format(protectedNumber),
      ]) {
        expect(serialised).not.toContain(protectedRendering);
      }
    }
  });
});
