import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AppShell } from "../app/AppShell";
import { DemoProvider } from "./DemoProvider";
import { createInitialDemoState } from "./fixtures";
import { createDemoStore } from "./store";
import type { DemoState, DemoStore } from "./types";

const protectedSentinels = [
  "PRIVATE-GOAL-7Q9X",
  "987654321",
  "876543219",
  "765432198",
];

function protectedState(): DemoState {
  const initial = createInitialDemoState();
  return {
    ...initial,
    mode: "employer",
    employee: {
      ...initial.employee,
      goal: {
        ...initial.employee.goal,
        name: protectedSentinels[0] ?? "PRIVATE-GOAL",
        targetAmount: Number(protectedSentinels[1]),
        savedAmount: Number(protectedSentinels[2]),
      },
      expenses: {
        ...initial.employee.expenses,
        housing: Number(protectedSentinels[3]),
      },
    },
  };
}

function privacyGuardStore(state: DemoState): DemoStore {
  const employee = { ...state.employee };
  Object.defineProperties(employee, {
    expenses: {
      enumerable: true,
      get() {
        throw new Error("Employer UI read protected employee expenses");
      },
    },
    goal: {
      enumerable: true,
      get() {
        throw new Error("Employer UI read protected employee goal");
      },
    },
  });
  const guardedState = { ...state, employee } as DemoState;
  return {
    dispatch() {},
    getState: () => guardedState,
    subscribe: () => () => {},
  };
}

function serialiseRenderedTree(root: Element): string {
  return [
    root.textContent ?? "",
    ...Array.from(root.attributes, (attribute) => attribute.value),
    ...Array.from(root.children, (child) => serialiseRenderedTree(child)),
  ].join("|");
}

describe("employer UI privacy boundary", () => {
  it("does not read or render protected employee financial fields", () => {
    const state = protectedState();
    const store = privacyGuardStore(state);

    const { container } = render(
      <DemoProvider store={store}>
        <AppShell />
      </DemoProvider>,
    );

    expect(
      screen.getByRole("heading", { name: /workforce overview/i }),
    ).toBeInTheDocument();
    const renderedTree = serialiseRenderedTree(container);
    for (const sentinel of protectedSentinels) {
      expect(renderedTree).not.toContain(sentinel);
    }
    expect(renderedTree).not.toContain("School Fees");
    expect(renderedTree).not.toContain("R2,520");
    expect(renderedTree).not.toContain("R6,000");
  });

  it("keeps protected fixture values out of employer mode", () => {
    const initial = createInitialDemoState();
    const store = createDemoStore({ ...initial, mode: "employer" });

    const { container } = render(
      <DemoProvider store={store}>
        <AppShell />
      </DemoProvider>,
    );

    const renderedTree = serialiseRenderedTree(container);
    expect(renderedTree).not.toContain("School Fees");
    expect(renderedTree).not.toContain("R2,520");
    expect(renderedTree).not.toContain("R6,000");
  });
});
