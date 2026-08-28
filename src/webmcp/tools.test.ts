import { describe, expect, it } from "vitest";

import { getAppStatusTool, webMcpTools } from "./tools";

describe("getAppStatusTool", () => {
  it("declares a narrow read-only tool schema", () => {
    expect(getAppStatusTool).toMatchObject({
      name: "get_app_status",
      annotations: { readOnlyHint: true },
      inputSchema: {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
    });
    expect(webMcpTools).toEqual([getAppStatusTool]);
  });

  it("returns structured, verifiable application status", async () => {
    await expect(getAppStatusTool.execute({})).resolves.toEqual({
      name: "Jem Unlocked",
      phase: "prototype",
      webMcpReady: true,
    });
  });

  it("rejects invalid input shapes when the caller bypasses the schema", async () => {
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
      await expect(execute(input)).rejects.toThrow(
        "get_app_status does not accept input properties.",
      );
    }
  });
});
