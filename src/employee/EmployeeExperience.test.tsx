import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { App } from "../app/App";
import { AppShell } from "../app/AppShell";
import { DemoProvider } from "../demo/DemoProvider";
import { createInitialDemoState } from "../demo/fixtures";
import { demoReducer } from "../demo/reducer";
import { createDemoStore } from "../demo/store";
import type { DemoState, DemoStore } from "../demo/types";

function setModelContext(modelContext: WebMCP.ModelContext | undefined) {
  Object.defineProperty(document, "modelContext", {
    configurable: true,
    value: modelContext,
  });
}

function createMutableStore(initialState = createInitialDemoState()): {
  store: DemoStore;
  replaceState(nextState: DemoState): void;
} {
  let state = initialState;
  const listeners = new Set<() => void>();
  return {
    store: {
      getState: () => state,
      dispatch(action) {
        const nextState = demoReducer(state, action);
        if (nextState !== state) {
          state = nextState;
          listeners.forEach((listener) => listener());
        }
      },
      subscribe(listener) {
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
    },
    replaceState(nextState) {
      state = nextState;
    },
  };
}

afterEach(() => {
  setModelContext(undefined);
});

describe("EmployeeExperience", () => {
  it("shows the state-backed goal and clearly labels shift estimates", () => {
    setModelContext(undefined);
    render(<App />);

    expect(
      screen.getByRole("heading", { name: /hey nomsa/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "School Fees" }),
    ).toBeInTheDocument();
    expect(screen.getByText("42% complete")).toBeInTheDocument();
    expect(
      screen.getByText(/R\s*480 estimated before deductions/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/8 days to payday/i)).toBeInTheDocument();
    expect(
      screen.queryByText(/2 of 3 learning items/i),
    ).not.toBeInTheDocument();
    expect(screen.getByText(/1 of 3 learning items/i)).toBeInTheDocument();
  });

  it("keeps tab selection in shared state and routes View shift to Shifts", () => {
    const store = createDemoStore();
    render(
      <DemoProvider store={store}>
        <AppShell />
      </DemoProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "View shift" }));

    expect(store.getState().employee.activeTab).toBe("shifts");
    expect(screen.getByRole("tab", { name: "Shifts" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(
      screen.getByRole("heading", { name: "Confirmed shifts" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Additional shifts" }),
    ).toBeInTheDocument();
  });

  it("provides a scoped non-shrinking tab structure for narrow screens", () => {
    render(
      <DemoProvider>
        <AppShell />
      </DemoProvider>,
    );

    const tablist = screen.getByRole("tablist", {
      name: "Employee dashboard",
    });
    expect(tablist.closest(".employee-experience__tabs")).toBeInTheDocument();
    expect(tablist).toHaveClass("tabs__list");
    screen.getAllByRole("tab").forEach((tab) => {
      expect(tab).toHaveClass("tabs__tab");
    });
  });

  it("previews and closes a shift request without mutating state", () => {
    const store = createDemoStore();
    render(
      <DemoProvider store={store}>
        <AppShell />
      </DemoProvider>,
    );

    fireEvent.click(screen.getByRole("tab", { name: "Shifts" }));
    fireEvent.click(
      screen.getByRole("button", {
        name: /request saturday rosebank shift/i,
      }),
    );

    const dialog = screen.getByRole("dialog", {
      name: /request sales floor at rosebank mall/i,
    });
    expect(within(dialog).getByText(/ready to confirm/i)).toBeInTheDocument();
    expect(
      within(dialog).getByText(/R\s*480 estimated before deductions/i),
    ).toBeInTheDocument();
    expect(within(dialog).getByText(/active pick n pay/i)).toBeInTheDocument();
    expect(store.getState().activity).toBeNull();
    expect(
      store
        .getState()
        .employee.shifts.find((shift) => shift.id === "shift-sat-rosebank")
        ?.status,
    ).toBe("available");

    fireEvent.click(within(dialog).getByRole("button", { name: /close/i }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(store.getState().activity).toBeNull();
  });

  it("confirms a shift and reward with persisted UI provenance", () => {
    const store = createDemoStore();
    render(
      <DemoProvider store={store}>
        <AppShell />
      </DemoProvider>,
    );

    fireEvent.click(screen.getByRole("tab", { name: "Shifts" }));
    fireEvent.click(
      screen.getByRole("button", {
        name: /request saturday rosebank shift/i,
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: /^confirm request$/i }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getAllByText("Requested").length).toBeGreaterThan(0);
    expect(store.getState().activity).toMatchObject({
      source: "ui",
      message: "Requested an additional shift.",
    });
    expect(screen.getByLabelText("Latest activity")).toHaveTextContent(
      "Requested an additional shift.",
    );

    fireEvent.click(screen.getByRole("tab", { name: "Rewards" }));
    fireEvent.click(
      screen.getByRole("button", { name: /allocate august safety award/i }),
    );
    expect(store.getState().employee.goal.savedAmount).toBe(2520);
    expect(store.getState().employee.rewards.at(-1)?.status).toBe("earned");
    expect(store.getState().activity?.message).toBe(
      "Requested an additional shift.",
    );
    expect(screen.getByLabelText(/add to jem savings/i)).toBeChecked();
    fireEvent.click(screen.getByLabelText(/add to jem savings/i));
    fireEvent.click(
      screen.getByRole("button", { name: /confirm allocation/i }),
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(
      screen.getByText(/R\s*150 added to Jem Savings/i),
    ).toBeInTheDocument();
    expect(store.getState().employee.goal.savedAmount).toBe(2670);
    expect(store.getState().activity).toMatchObject({
      source: "ui",
      message: "Allocated a reward.",
    });

    fireEvent.click(screen.getByRole("tab", { name: "Overview" }));
    expect(screen.getByText("45% complete")).toBeInTheDocument();
  });

  it("re-previews a voucher allocation before confirming it", () => {
    const store = createDemoStore();
    render(
      <DemoProvider store={store}>
        <AppShell />
      </DemoProvider>,
    );

    fireEvent.click(screen.getByRole("tab", { name: "Rewards" }));
    fireEvent.click(
      screen.getByRole("button", { name: /allocate august safety award/i }),
    );
    fireEvent.click(screen.getByLabelText(/choose a voucher/i));

    expect(
      screen.getByText(/preview destination: a voucher/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/goal savings after allocation: R\s*2\s*520/i),
    ).toBeInTheDocument();
    expect(store.getState().employee.goal.savedAmount).toBe(2520);
    expect(store.getState().employee.rewards.at(-1)).toMatchObject({
      status: "earned",
      allocatedTo: null,
    });
    expect(store.getState().activity).toBeNull();

    fireEvent.click(
      screen.getByRole("button", { name: /confirm allocation/i }),
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(store.getState().employee.goal.savedAmount).toBe(2520);
    expect(store.getState().employee.rewards.at(-1)).toMatchObject({
      status: "allocated",
      allocatedTo: "voucher",
    });
    expect(store.getState().activity).toMatchObject({
      source: "ui",
      message: "Allocated a reward.",
    });
    expect(screen.getByText(/R\s*150 added to a voucher/i)).toBeInTheDocument();
  });

  it("disables reward confirmation when the selected destination cannot be previewed", () => {
    const mutable = createMutableStore();
    render(
      <DemoProvider store={mutable.store}>
        <AppShell />
      </DemoProvider>,
    );

    fireEvent.click(screen.getByRole("tab", { name: "Rewards" }));
    fireEvent.click(
      screen.getByRole("button", { name: /allocate august safety award/i }),
    );

    const current = mutable.store.getState();
    mutable.replaceState({
      ...current,
      employee: {
        ...current.employee,
        rewards: current.employee.rewards.map((reward) =>
          reward.id === "reward-safety"
            ? { ...reward, status: "allocated", allocatedTo: "voucher" }
            : reward,
        ),
      },
    });
    fireEvent.click(screen.getByLabelText(/choose a voucher/i));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Choose another earned reward.",
    );
    expect(
      screen.getByRole("button", { name: /confirm allocation/i }),
    ).toBeDisabled();
    expect(mutable.store.getState().activity).toBeNull();
  });

  it("keeps a failed allocation dialog open with recovery guidance", () => {
    const mutable = createMutableStore();
    render(
      <DemoProvider store={mutable.store}>
        <AppShell />
      </DemoProvider>,
    );

    fireEvent.click(screen.getByRole("tab", { name: "Rewards" }));
    fireEvent.click(
      screen.getByRole("button", { name: /allocate august safety award/i }),
    );

    const current = mutable.store.getState();
    mutable.replaceState({
      ...current,
      employee: {
        ...current.employee,
        rewards: current.employee.rewards.map((reward) =>
          reward.id === "reward-safety"
            ? { ...reward, status: "allocated", allocatedTo: "voucher" }
            : reward,
        ),
      },
    });

    fireEvent.click(
      screen.getByRole("button", { name: /confirm allocation/i }),
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Choose another earned reward.",
    );
    expect(screen.queryByText(/added to jem savings/i)).not.toBeInTheDocument();
    expect(mutable.store.getState().activity).toBeNull();
  });
});
