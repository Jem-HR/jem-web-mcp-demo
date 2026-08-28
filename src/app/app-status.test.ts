import { describe, expect, it } from "vitest";

import { getAppStatus } from "./app-status";

describe("getAppStatus", () => {
  it("returns the stable prototype status shared by humans and agents", () => {
    expect(getAppStatus()).toEqual({
      name: "Jem Unlocked",
      phase: "prototype",
      webMcpReady: true,
    });
  });
});
