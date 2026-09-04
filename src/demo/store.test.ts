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

  it("records supplied audit outcomes without accepting proposal input", () => {
    const store = createDemoStore();

    store.dispatch({
      type: "audit/record",
      event: {
        type: "policy_denied",
        actorId: "employee",
        source: "webmcp",
        action: "create_opportunity_draft",
        outcome: "denied",
        summary: "Action is outside the simulated actor scope.",
      },
    });

    expect(store.getState()).toMatchObject({ revision: 2 });
    expect(store.getState().auditEvents).toEqual([
      expect.objectContaining({
        id: "audit-2",
        policyRevision: 1,
        stateRevision: 2,
        timestamp: "demo-revision-2",
        summary: "Action is outside the simulated actor scope.",
      }),
    ]);
  });
});
