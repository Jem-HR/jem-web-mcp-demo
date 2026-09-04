import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AppShell } from "../app/AppShell";
import { DemoProvider } from "./DemoProvider";
import { createInitialDemoState } from "./fixtures";
import { demoReducer } from "./reducer";
import type { DemoState, DemoStore } from "./types";

const protectedRawSentinels = [
  "PRIVATE_GOAL_NAME_7Q9X",
  "PRIVATE_GOAL_EMOJI_4W2P",
  "987654321",
  "876543219",
  "765432198",
  "654321987",
  "543219876",
  "432198765",
  "321987654",
  "219876543",
  "198765432",
] as const;

const protectedCurrencySentinels = [
  "R 987 654 321",
  "R 876 543 219",
  "R 765 432 198",
  "R 654 321 987",
  "R 543 219 876",
  "R 432 198 765",
  "R 321 987 654",
  "R 219 876 543",
  "R 198 765 432",
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
        name: protectedRawSentinels[0],
        emoji: protectedRawSentinels[1],
        targetAmount: Number(protectedRawSentinels[2]),
        savedAmount: Number(protectedRawSentinels[3]),
        monthlyContribution: Number(protectedRawSentinels[4]),
      },
      expenses: {
        housing: Number(protectedRawSentinels[5]),
        transport: Number(protectedRawSentinels[6]),
        food: Number(protectedRawSentinels[7]),
        dependants: Number(protectedRawSentinels[8]),
        debt: Number(protectedRawSentinels[9]),
        airtime: Number(protectedRawSentinels[10]),
        other: Number(protectedRawSentinels[2]),
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
  let guardedState = { ...state, employee } as DemoState;
  const listeners = new Set<() => void>();
  return {
    dispatch(action) {
      const nextState = demoReducer(guardedState, action);
      if (nextState === guardedState) return;
      guardedState = nextState;
      listeners.forEach((listener) => listener());
    },
    getState: () => guardedState,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
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
  it("does not read or render protected employee financial fields in any panel", () => {
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
    const panels = [
      ["Dashboard", /programmes/i],
      ["Create Opportunity", /build an opportunity/i],
      ["Manage Shifts", /open shifts/i],
      ["Fairness & Data", /fairness and data/i],
    ] as const;

    for (const [tabName, heading] of panels) {
      fireEvent.click(screen.getByRole("tab", { name: tabName }));
      expect(
        screen.getByRole("heading", { name: heading }),
      ).toBeInTheDocument();

      const renderedTree = serialiseRenderedTree(container);
      for (const sentinel of [
        ...protectedRawSentinels,
        ...protectedCurrencySentinels,
      ]) {
        expect(renderedTree).not.toContain(sentinel);
      }
    }
  });
});
