import { describe, expect, it } from "vitest";

import { getAppStatus } from "./app-status";

describe("getAppStatus", () => {
  it("returns the stable foundation status shared by humans and agents", () => {
    expect(getAppStatus()).toEqual({
      name: "Jem WebMCP Demo",
      phase: "foundation",
      webMcpReady: true,
    });
  });
});
