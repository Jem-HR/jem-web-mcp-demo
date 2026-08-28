import { createInitialDemoState } from "./fixtures";
import { demoReducer } from "./reducer";
import type { DemoState, DemoStore } from "./types";

export function createDemoStore(
  initialState: DemoState = createInitialDemoState(),
): DemoStore {
  let state = initialState;
  const listeners = new Set<() => void>();

  return {
    getState: () => state,
    dispatch(action) {
      const next = demoReducer(state, action);
      if (next !== state) {
        state = next;
        listeners.forEach((listener) => listener());
      }
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
