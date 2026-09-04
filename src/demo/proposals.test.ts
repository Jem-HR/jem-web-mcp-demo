import { describe, expect, it } from "vitest";
import { createInitialDemoState } from "./fixtures";
import {
  canonicalInputFingerprint,
  createActionProposal,
  findProposal,
  verifyExecutableProposal,
} from "./proposals";
import { demoReducer } from "./reducer";
import type { ActionProposal, DemoState } from "./types";

const action = "request_shift";
const input = { shiftId: "shift-sat-rosebank", preferences: { travel: true } };

function proposalState(status: ActionProposal["status"] = "approved"): {
  state: DemoState;
  proposal: ActionProposal;
} {
  const initial = createInitialDemoState();
  const proposal = {
    ...createActionProposal(initial, {
      action,
      input,
      warnings: ["A request does not guarantee assignment."],
      effects: ["Request the Saturday shift."],
      expiresAfterRevisions: 3,
    }),
    status,
  };
  return {
    state: { ...initial, proposals: [proposal] },
    proposal,
  };
}

function expectErrorCode(
  state: DemoState,
  expectedCode:
    | "CONFIRMATION_REQUIRED"
    | "PROPOSAL_NOT_FOUND"
    | "PROPOSAL_MISMATCH"
    | "STALE_PROPOSAL"
    | "EXPIRED_PROPOSAL"
    | "ALREADY_EXECUTED",
  overrides: Partial<{
    proposalId: string;
    action: string;
    input: unknown;
  }> = {},
): void {
  const proposal = state.proposals[0];
  const result = verifyExecutableProposal(state, {
    proposalId: proposal?.id ?? "missing-proposal",
    action,
    input,
    ...overrides,
  });

  expect(result).toMatchObject({
    ok: false,
    status: "error",
    error: { code: expectedCode },
  });
  if (!result.ok) expect(result.error.recovery.length).toBeGreaterThan(0);
}

describe("action proposals", () => {
  it("fingerprints equivalent object inputs canonically without exposing input", () => {
    const first = canonicalInputFingerprint({
      amount: 250,
      destination: "savings",
      details: { b: false, a: [1, null, "two"] },
    });
    const second = canonicalInputFingerprint({
      details: { a: [1, null, "two"], b: false },
      destination: "savings",
      amount: 250,
    });

    expect(first).toBe(second);
    expect(first).toMatch(/^fp-v1-[a-f0-9]{16}$/);
    expect(first).not.toContain("savings");
    expect(canonicalInputFingerprint({ amount: 251 })).not.toBe(first);
  });

  it("creates and finds a deterministic proposal bound to active context", () => {
    const state = createInitialDemoState();
    const proposal = createActionProposal(state, {
      action,
      input,
      warnings: ["A request does not guarantee assignment."],
      effects: ["Request the Saturday shift."],
      expiresAfterRevisions: 3,
    });
    const repeat = createActionProposal(state, {
      action,
      input: { preferences: { travel: true }, shiftId: "shift-sat-rosebank" },
      warnings: ["A request does not guarantee assignment."],
      effects: ["Request the Saturday shift."],
      expiresAfterRevisions: 3,
    });

    expect(proposal).toEqual({
      id: expect.stringMatching(/^proposal-[a-f0-9]{16}$/),
      action,
      actorId: "employee",
      policyRevision: 1,
      inputFingerprint: expect.stringMatching(/^fp-v1-[a-f0-9]{16}$/),
      stateRevision: 1,
      expiresAt: 4,
      warnings: ["A request does not guarantee assignment."],
      effects: ["Request the Saturday shift."],
      status: "pending",
    });
    expect(repeat.id).toBe(proposal.id);
    expect(findProposal({ ...state, proposals: [proposal] }, proposal.id)).toBe(
      proposal,
    );
  });

  it("accepts only the exact approved proposal", () => {
    const { state, proposal } = proposalState();

    expect(
      verifyExecutableProposal(state, {
        proposalId: proposal.id,
        action,
        input: { preferences: { travel: true }, shiftId: "shift-sat-rosebank" },
      }),
    ).toEqual({
      ok: true,
      status: "read",
      summary: "Approved proposal is executable.",
      data: proposal,
    });
  });

  it("rejects an unknown proposal ID", () => {
    const { state } = proposalState();
    expectErrorCode(state, "PROPOSAL_NOT_FOUND", {
      proposalId: "proposal-not-present",
    });
  });

  it("rejects an execution from another actor", () => {
    const { state } = proposalState();
    expectErrorCode(
      {
        ...state,
        actorSession: { ...state.actorSession, actorId: "employer" },
      },
      "STALE_PROPOSAL",
    );
  });

  it("rejects an execution under another policy revision", () => {
    const { state } = proposalState();
    expectErrorCode(
      {
        ...state,
        actorSession: { ...state.actorSession, policyRevision: 2 },
      },
      "STALE_PROPOSAL",
    );
  });

  it("rejects an execution after state changes", () => {
    const { state } = proposalState();
    expectErrorCode({ ...state, revision: 2 }, "STALE_PROPOSAL");
  });

  it("rejects changed action or input", () => {
    const { state } = proposalState();
    expectErrorCode(state, "PROPOSAL_MISMATCH", {
      action: "allocate_reward",
    });
    expectErrorCode(state, "PROPOSAL_MISMATCH", {
      input: { shiftId: "shift-sun-rosebank" },
    });
  });

  it("distinguishes expiry, missing approval, invalidation, and replay", () => {
    const expired = proposalState();
    expectErrorCode(
      { ...expired.state, revision: expired.proposal.expiresAt + 1 },
      "EXPIRED_PROPOSAL",
    );
    expectErrorCode(proposalState("pending").state, "CONFIRMATION_REQUIRED");
    expectErrorCode(proposalState("rejected").state, "STALE_PROPOSAL");
    expectErrorCode(proposalState("invalidated").state, "STALE_PROPOSAL");
    expectErrorCode(proposalState("executed").state, "ALREADY_EXECUTED");
  });

  it("creates, approves, and consumes a proposal exactly once", () => {
    const initial = createInitialDemoState();
    const proposal = createActionProposal(initial, {
      action,
      input,
      warnings: [],
      effects: ["Request the Saturday shift."],
    });
    const created = demoReducer(initial, {
      type: "proposal/create",
      proposal,
      source: "webmcp",
    });
    const approved = demoReducer(created, {
      type: "proposal/approve",
      proposalId: proposal.id,
    });
    const executed = demoReducer(approved, {
      type: "proposal/execute",
      proposalId: proposal.id,
      action,
      input,
    });
    const replayed = demoReducer(executed, {
      type: "proposal/execute",
      proposalId: proposal.id,
      action,
      input,
    });

    expect(created.revision).toBe(1);
    expect(approved.revision).toBe(1);
    expect(executed.revision).toBe(1);
    expect(executed.proposals[0]).toMatchObject({
      status: "executed",
      execution: {
        actorId: "employee",
        policyRevision: 1,
        stateRevision: 1,
        executedAt: "demo-event-3",
      },
    });
    expect(executed.auditEvents.map((event) => event.type)).toEqual([
      "proposal_created",
      "proposal_approved",
      "proposal_executed",
    ]);
    expect(replayed).toBe(executed);
  });

  it("retains and invalidates outstanding proposals after a business mutation", () => {
    const initial = createInitialDemoState();
    const proposal = {
      ...createActionProposal(initial, {
        action,
        input,
        warnings: [],
        effects: ["Request the Saturday shift."],
      }),
      status: "approved" as const,
    };
    const state = { ...initial, proposals: [proposal] };
    const mutated = demoReducer(state, {
      type: "employee/replace-goal",
      goal: { ...state.employee.goal, monthlyContribution: 450 },
      source: "ui",
    });

    expect(mutated.revision).toBe(2);
    expect(mutated.proposals).toEqual([
      expect.objectContaining({ id: proposal.id, status: "invalidated" }),
    ]);
  });
});
