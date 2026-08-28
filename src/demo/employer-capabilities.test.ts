import { describe, expect, it } from "vitest";
import { createEmployerCapabilities } from "./employer-capabilities";
import { createDemoStore } from "./store";

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
  exceptionPolicy: "Approved leave and employer roster changes enter review",
};

describe("employer capabilities", () => {
  it("previews and saves a draft without launching it", () => {
    const store = createDemoStore();
    const capabilities = createEmployerCapabilities(store);

    expect(
      capabilities.createOpportunityDraft({ ...validDraft, confirm: false }),
    ).toMatchObject({ ok: true, status: "preview" });
    expect(store.getState().employer.activeDraft).toBeNull();

    expect(
      capabilities.createOpportunityDraft({ ...validDraft, confirm: true }),
    ).toMatchObject({ ok: true, status: "applied" });
    expect(store.getState().employer.activeDraft).toMatchObject({
      id: "draft-opportunity",
      status: "draft",
    });
    expect(store.getState().activity?.source).toBe("webmcp");
  });

  it("summarises programmes, non-confirmed shifts, and fairness exceptions", () => {
    const capabilities = createEmployerCapabilities(createDemoStore());

    expect(capabilities.listProgrammes()).toMatchObject({
      ok: true,
      data: [
        {
          id: "programme-reliability",
          remaining: 31250,
          participationPercent: 77,
        },
        { id: "programme-safety", remaining: 21800, participationPercent: 26 },
        {
          id: "programme-open-shifts",
          remaining: 75000,
          participationPercent: 0,
        },
      ],
    });
    expect(capabilities.listProgrammes({ status: "draft" })).toMatchObject({
      ok: true,
      data: [{ id: "programme-open-shifts" }],
    });
    expect(capabilities.listOpenShifts()).toMatchObject({
      ok: true,
      data: [
        { id: "shift-sat-rosebank", status: "available" },
        { id: "shift-thu-sandton", status: "requested" },
        { id: "shift-sun-rosebank", status: "available" },
      ],
    });
    expect(
      capabilities.listFairnessExceptions({ severity: "low" }),
    ).toMatchObject({
      ok: true,
      data: [{ id: "exception-missing-leave" }],
    });
  });

  it("rejects malformed read filters without exposing data", () => {
    const capabilities = createEmployerCapabilities(createDemoStore());

    expect(
      capabilities.listProgrammes({ status: "closed" } as never),
    ).toMatchObject({
      ok: false,
      error: { code: "INVALID_INPUT" },
    });
    expect(
      capabilities.listFairnessExceptions({ severity: "high" } as never),
    ).toMatchObject({ ok: false, error: { code: "INVALID_INPUT" } });
  });

  it("rejects malformed drafts without dispatching", () => {
    const store = createDemoStore();
    const capabilities = createEmployerCapabilities(store);

    expect(
      capabilities.createOpportunityDraft({
        ...validDraft,
        rewardType: "points",
        confirm: true,
      } as never),
    ).toMatchObject({ ok: false, error: { code: "INVALID_INPUT" } });
    expect(
      capabilities.createOpportunityDraft({
        ...validDraft,
        startDate: "2026-02-30",
        confirm: true,
      }),
    ).toMatchObject({ ok: false, error: { code: "INVALID_INPUT" } });
    expect(store.getState().employer.activeDraft).toBeNull();
    expect(store.getState().activity).toBeNull();
  });

  it("validates fairness and blocks a budget below maximum exposure", () => {
    const store = createDemoStore();
    const capabilities = createEmployerCapabilities(store);
    capabilities.createOpportunityDraft({
      ...validDraft,
      totalBudget: 50000,
      confirm: true,
    });

    expect(
      capabilities.validateOpportunity({ draftId: "draft-opportunity" }),
    ).toMatchObject({
      ok: false,
      error: { code: "BUDGET_EXCEEDED" },
    });
    expect(store.getState().employer.validation).toBeNull();
  });

  it("records review-required validation only for the active draft", () => {
    const store = createDemoStore();
    const capabilities = createEmployerCapabilities(store);
    capabilities.createOpportunityDraft({ ...validDraft, confirm: true });

    expect(
      capabilities.validateOpportunity({ draftId: "draft-opportunity" }),
    ).toMatchObject({
      ok: true,
      status: "applied",
      data: {
        readiness: "review_required",
        rulesClear: true,
        dataAvailable: true,
        dataFresh: true,
        fairnessPassed: false,
        budgetWithinLimit: true,
        eligibleEmployeeCount: 412,
        expectedParticipationPercent: 68,
        estimatedCost: 70040,
        maximumExposure: 103000,
        unresolvedExceptionCount: 3,
        issues: ["3 fairness exceptions require review before launch."],
      },
    });
    expect(store.getState().employer.validation?.readiness).toBe(
      "review_required",
    );
    expect(
      capabilities.validateOpportunity({ draftId: "missing" }),
    ).toMatchObject({ ok: false, error: { code: "NOT_FOUND" } });
  });
});
