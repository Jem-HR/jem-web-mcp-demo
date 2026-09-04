import { describe, expect, it, vi } from "vitest";
import { createInitialDemoState } from "./fixtures";
import { createDemoStore } from "./store";

describe("createDemoStore", () => {
  it("starts on the completed employee dashboard and can reset to onboarding", () => {
    const store = createDemoStore();
    expect(store.getState()).toMatchObject({
      mode: "employee",
      actorSession: {
        actorId: "employee",
        displayName: "Nomsa Dlamini",
        policyRevision: 1,
      },
      revision: 1,
      auditEvents: [],
      onboarding: { completed: true, step: 1 },
      employee: { activeTab: "overview" },
    });

    store.dispatch({ type: "demo/reset" });
    expect(store.getState()).toMatchObject({
      mode: "employee",
      onboarding: { completed: false, step: 1 },
    });
    expect(store.getState().revision).toBe(2);
    expect(store.getState().auditEvents).toHaveLength(1);
  });

  it("publishes immutable reducer transitions to subscribers", () => {
    const store = createDemoStore();
    const initial = store.getState();
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);

    store.dispatch({ type: "navigation/set-mode", mode: "employer" });

    expect(store.getState()).not.toBe(initial);
    expect(store.getState().mode).toBe("employer");
    expect(store.getState()).toMatchObject({
      actorSession: {
        actorId: "employer",
        displayName: "Sipho Khumalo",
        policyRevision: 2,
      },
      revision: 2,
    });
    expect(store.getState().auditEvents).toMatchObject([
      {
        type: "actor_changed",
        actorId: "employer",
        policyRevision: 2,
        action: "navigation/set-mode",
        summary: "Switched simulated actor scope.",
      },
    ]);
    expect(listener).toHaveBeenCalledOnce();
    unsubscribe();
  });

  it("creates independent fixture graphs", () => {
    expect(createInitialDemoState()).not.toBe(createInitialDemoState());
    expect(createInitialDemoState().employee.goal).not.toBe(
      createInitialDemoState().employee.goal,
    );
  });

  it("increments an open shift application once on the first request", () => {
    const store = createDemoStore();
    const request = {
      type: "employee/request-shift" as const,
      shiftId: "shift-sat-rosebank",
      source: "webmcp" as const,
    };

    store.dispatch(request);
    expect(
      store
        .getState()
        .employee.shifts.find((shift) => shift.id === request.shiftId),
    ).toMatchObject({ status: "requested", applications: 4 });
    expect(store.getState().revision).toBe(2);
    expect(store.getState().auditEvents).toMatchObject([
      {
        type: "business_mutation",
        action: "employee/request-shift",
        summary: "Requested an additional shift.",
      },
    ]);

    store.dispatch(request);
    expect(
      store
        .getState()
        .employee.shifts.find((shift) => shift.id === request.shiftId),
    ).toMatchObject({ status: "requested", applications: 4 });
    expect(store.getState().revision).toBe(2);
    expect(store.getState().auditEvents).toHaveLength(1);
  });

  it("rejects employee mutations from the employer actor without changing employee data", () => {
    const store = createDemoStore();
    store.dispatch({ type: "session/set-actor", actorId: "employer" });
    const before = store.getState().employee.goal.savedAmount;

    store.dispatch({
      type: "employee/allocate-reward",
      rewardId: "reward-safety",
      destination: "savings",
      source: "webmcp",
    });

    expect(store.getState().employee.goal.savedAmount).toBe(before);
    expect(store.getState().auditEvents).toEqual([
      expect.objectContaining({
        id: "audit-2",
        actorId: "employer",
        type: "actor_changed",
      }),
      expect.objectContaining({
        id: "audit-3",
        actorId: "employer",
        type: "policy_denied",
        action: "allocate_reward",
        summary: "This action is outside the simulated actor scope.",
        policyRevision: 2,
        stateRevision: 3,
      }),
    ]);
  });

  it("redacts forged audit actor and free text while retaining a safe event", () => {
    const store = createDemoStore();

    store.dispatch({
      type: "audit/record",
      eventType: "policy_denied",
      outcome: "denied",
      event: {
        actorId: "employer",
        action: "raw-user-input",
        proposalId: "secret-proposal-id",
        summary: "A raw private goal: School Fees",
      },
    } as unknown as Parameters<typeof store.dispatch>[0]);

    expect(store.getState().auditEvents).toEqual([
      expect.objectContaining({
        actorId: "employee",
        type: "policy_denied",
        action: "policy_denied",
        summary: "This action is outside the simulated actor scope.",
      }),
    ]);
    expect(store.getState().auditEvents[0]).not.toHaveProperty("proposalId");
  });

  it("resets employer scope to the employee fixture with forward policy revisions", () => {
    const store = createDemoStore();
    store.dispatch({ type: "session/set-actor", actorId: "employer" });

    store.dispatch({ type: "demo/reset" });

    expect(store.getState()).toMatchObject({
      mode: "employee",
      actorSession: { actorId: "employee", policyRevision: 3 },
      revision: 3,
    });
    expect(store.getState().auditEvents.at(-1)).toMatchObject({
      actorId: "employee",
      type: "actor_changed",
      action: "demo/reset",
      policyRevision: 3,
      summary: "Reset demo and switched simulated actor scope.",
    });
  });
});
