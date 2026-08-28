import { describe, expect, it, vi } from "vitest";
import { createInitialDemoState } from "./fixtures";
import { createDemoStore } from "./store";

describe("createDemoStore", () => {
  it("starts on the completed employee dashboard and can reset to onboarding", () => {
    const store = createDemoStore();
    expect(store.getState()).toMatchObject({
      mode: "employee",
      onboarding: { completed: true, step: 1 },
      employee: { activeTab: "overview" },
    });

    store.dispatch({ type: "demo/reset" });
    expect(store.getState()).toMatchObject({
      mode: "employee",
      onboarding: { completed: false, step: 1 },
    });
  });

  it("publishes immutable reducer transitions to subscribers", () => {
    const store = createDemoStore();
    const initial = store.getState();
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);

    store.dispatch({ type: "navigation/set-mode", mode: "employer" });

    expect(store.getState()).not.toBe(initial);
    expect(store.getState().mode).toBe("employer");
    expect(listener).toHaveBeenCalledOnce();
    unsubscribe();
  });

  it("creates independent fixture graphs", () => {
    expect(createInitialDemoState()).not.toBe(createInitialDemoState());
    expect(createInitialDemoState().employee.goal).not.toBe(
      createInitialDemoState().employee.goal,
    );
  });
});
