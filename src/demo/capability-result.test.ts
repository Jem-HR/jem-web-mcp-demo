import { describe, expect, it } from "vitest";
import { proposalErrorResult } from "./capability-result";

describe("proposal capability errors", () => {
  it.each([
    "POLICY_DENIED",
    "PROPOSAL_NOT_FOUND",
    "PROPOSAL_MISMATCH",
    "STALE_PROPOSAL",
    "EXPIRED_PROPOSAL",
    "ALREADY_EXECUTED",
  ] as const)("returns a recoverable %s error", (code) => {
    const result = proposalErrorResult(code);

    expect(result).toMatchObject({
      ok: false,
      status: "error",
      error: { code },
    });
    if (!result.ok) {
      expect(result.error.message.length).toBeGreaterThan(0);
      expect(result.error.recovery.length).toBeGreaterThan(0);
    }
  });
});
