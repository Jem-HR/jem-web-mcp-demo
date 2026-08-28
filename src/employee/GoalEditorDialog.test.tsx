import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DemoProvider } from "../demo/DemoProvider";
import { createInitialDemoState } from "../demo/fixtures";
import { createDemoStore } from "../demo/store";
import { GoalEditorDialog } from "./GoalEditorDialog";

describe("GoalEditorDialog", () => {
  it("applies an edited goal through the employee capability", () => {
    const store = createDemoStore();
    const onClose = vi.fn();
    render(
      <DemoProvider store={store}>
        <GoalEditorDialog open onClose={onClose} />
      </DemoProvider>,
    );

    fireEvent.change(screen.getByLabelText(/goal name/i), {
      target: { value: "December Fund" },
    });
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

    expect(store.getState().employee.goal.name).toBe("December Fund");
    expect(store.getState().activity?.source).toBe("ui");
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("updates the goal name from a named goal choice", () => {
    const store = createDemoStore();
    render(
      <DemoProvider store={store}>
        <GoalEditorDialog open onClose={() => undefined} />
      </DemoProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Emergency Fund" }));

    expect(screen.getByDisplayValue("Emergency Fund")).toBeInTheDocument();
  });

  it("keeps the editor open and shows recovery text for an invalid goal", () => {
    const initialState = createInitialDemoState();
    const store = createDemoStore({
      ...initialState,
      employee: {
        ...initialState.employee,
        goal: { ...initialState.employee.goal, targetAmount: 1 },
      },
    });
    const onClose = vi.fn();
    render(
      <DemoProvider store={store}>
        <GoalEditorDialog open onClose={onClose} />
      </DemoProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Provide a name, valid amounts and a future target date.",
    );
    expect(store.getState().employee.goal.name).toBe("School Fees");
    expect(onClose).not.toHaveBeenCalled();
  });

  it("saves expenses through the UI capability and closes the editor", () => {
    const store = createDemoStore();
    const onClose = vi.fn();
    render(
      <DemoProvider store={store}>
        <GoalEditorDialog open onClose={onClose} />
      </DemoProvider>,
    );

    fireEvent.click(screen.getByRole("tab", { name: "Expenses" }));
    fireEvent.change(screen.getByLabelText(/food/i), {
      target: { value: "850" },
    });
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

    expect(store.getState().employee.expenses.food).toBe(850);
    expect(store.getState().activity?.source).toBe("ui");
    expect(onClose).toHaveBeenCalledOnce();
  });
});
