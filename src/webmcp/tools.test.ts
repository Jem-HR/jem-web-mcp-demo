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
      name: "Jem WebMCP Demo",
      phase: "foundation",
      webMcpReady: true,
    });
  });

  it("rejects unexpected input even when the caller bypasses the schema", async () => {
    await expect(
      getAppStatusTool.execute({ unexpected: true }),
    ).rejects.toThrow("get_app_status does not accept input properties.");
  });
});
