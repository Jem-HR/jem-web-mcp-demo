import { describe, expect, it } from "vitest";

import { createDemoCapabilities } from "../demo/capabilities";
import { createDemoStore } from "../demo/store";
import { createWebMcpTools, getAppStatusTool } from "./tools";

describe("getAppStatusTool", () => {
  it("declares a narrow read-only tool schema", () => {
    expect(getAppStatusTool).toMatchObject({
      name: "get_app_status",
      annotations: { readOnlyHint: true },
      inputSchema: {
        type: "object",
        properties: {},
        required: [],
        additionalProperties: false,
      },
    });
    expect(getAppStatusTool.description).toContain(
      "completed Jem Unlocked prototype",
    );
    expect(getAppStatusTool.description).not.toContain("foundation status");
  });

  it("registers twelve tools in deterministic order", () => {
    const tools = createWebMcpTools(createDemoCapabilities(createDemoStore()));

    expect(tools).toHaveLength(12);
    expect(tools.map((tool) => tool.name)).toEqual([
      "get_app_status",
      "get_employee_dashboard",
      "update_savings_goal",
      "list_employee_opportunities",
      "request_shift",
      "allocate_reward",
      "get_employer_dashboard",
      "list_programmes",
      "create_opportunity_draft",
      "validate_opportunity",
      "list_open_shifts",
      "list_fairness_exceptions",
    ]);
  });

  it("returns structured, verifiable application status", async () => {
    await expect(getAppStatusTool.execute({})).resolves.toEqual({
      name: "Jem Unlocked",
      phase: "prototype",
      webMcpReady: true,
    });
  });

  it("returns redacted invalid-input results when the caller bypasses the schema", async () => {
    const execute = getAppStatusTool.execute as (
      input: unknown,
    ) => Promise<unknown>;
    const invalidInputs = [
      null,
      undefined,
      true,
      42,
      "unexpected",
      [],
      ["unexpected"],
      { unexpected: true },
    ];

    for (const input of invalidInputs) {
      await expect(execute(input)).resolves.toEqual({
        ok: false,
        status: "error",
        error: {
          code: "INVALID_INPUT",
          message: "The tool input is invalid.",
          recovery: "Use the tool schema and provide only documented fields.",
        },
      });
    }

    const redacted = await execute({
      "sk-protected-key": "sk-protected-value",
    });
    expect(JSON.stringify(redacted)).not.toContain("sk-protected");
  });
});
