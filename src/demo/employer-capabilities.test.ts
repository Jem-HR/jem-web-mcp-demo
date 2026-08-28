import { describe, expect, it } from "vitest";
import { createEmployerCapabilities } from "./employer-capabilities";
import { createInitialDemoState } from "./fixtures";
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
    ).toMatchObject({
      ok: true,
      status: "preview",
      warnings: [
        "This saves a draft only; it does not launch or approve a programme.",
      ],
    });
    expect(store.getState().employer.activeDraft).toBeNull();

    const applied = capabilities.createOpportunityDraft({
      ...validDraft,
      confirm: true,
    });
    expect(applied).toMatchObject({ ok: true, status: "applied" });
    expect(applied).not.toHaveProperty("warnings");
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

  it("rejects an invalid draft source without dispatching", () => {
    const store = createDemoStore();
    const capabilities = createEmployerCapabilities(store);

    expect(
      capabilities.createOpportunityDraft(
        { ...validDraft, confirm: true },
        "automation" as never,
      ),
    ).toMatchObject({ ok: false, error: { code: "INVALID_INPUT" } });
    expect(store.getState().employer.activeDraft).toBeNull();
    expect(store.getState().activity).toBeNull();
  });

  it("blocks a budget below the draft-derived maximum exposure", () => {
    const store = createDemoStore();
    const capabilities = createEmployerCapabilities(store);
    capabilities.createOpportunityDraft({
      ...validDraft,
      rewardAmount: 100,
      maxPerEmployee: 120,
      totalBudget: 49000,
      confirm: true,
    });

    expect(
      capabilities.validateOpportunity({ draftId: "draft-opportunity" }),
    ).toEqual({
      ok: false,
      status: "error",
      error: {
        code: "BUDGET_EXCEEDED",
        message: "The total budget is below the maximum possible exposure.",
        recovery:
          "Increase the budget to at least R49,440 or reduce eligible reach or the maximum per employee.",
      },
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

  it("derives rounded cost and exposure from multiple active draft values", () => {
    const store = createDemoStore();
    const capabilities = createEmployerCapabilities(store);
    capabilities.createOpportunityDraft({
      ...validDraft,
      rewardAmount: 127.5,
      maxPerEmployee: 300,
      totalBudget: 123600,
      confirm: true,
    });

    expect(
      capabilities.validateOpportunity({ draftId: "draft-opportunity" }),
    ).toMatchObject({
      ok: true,
      status: "applied",
      data: {
        readiness: "review_required",
        budgetWithinLimit: true,
        estimatedCost: 35720,
        maximumExposure: 123600,
        issues: ["3 fairness exceptions require review before launch."],
      },
    });
  });

  it("keeps the fixed review-required validation DTO when injected exceptions are empty", () => {
    const initial = createInitialDemoState();
    const store = createDemoStore({
      ...initial,
      employer: { ...initial.employer, fairnessExceptions: [] },
    });
    const capabilities = createEmployerCapabilities(store);
    capabilities.createOpportunityDraft({ ...validDraft, confirm: true });

    expect(
      capabilities.validateOpportunity({ draftId: "draft-opportunity" }),
    ).toMatchObject({
      ok: true,
      status: "applied",
      data: {
        readiness: "review_required",
        fairnessPassed: false,
        unresolvedExceptionCount: 3,
        issues: ["3 fairness exceptions require review before launch."],
      },
    });
  });

  it("rejects an invalid validation source without dispatching", () => {
    const store = createDemoStore();
    const capabilities = createEmployerCapabilities(store);
    capabilities.createOpportunityDraft({ ...validDraft, confirm: true });
    const priorActivity = store.getState().activity;

    expect(
      capabilities.validateOpportunity(
        { draftId: "draft-opportunity" },
        "automation" as never,
      ),
    ).toMatchObject({ ok: false, error: { code: "INVALID_INPUT" } });
    expect(store.getState().employer.validation).toBeNull();
    expect(store.getState().activity).toBe(priorActivity);
  });
});
