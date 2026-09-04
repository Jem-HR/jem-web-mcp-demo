import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DemoProvider } from "../demo/DemoProvider";
import { createInitialDemoState } from "../demo/fixtures";
import { createDemoStore } from "../demo/store";
import { App } from "./App";
import { AppShell } from "./AppShell";

function setModelContext(modelContext: WebMCP.ModelContext | undefined) {
  Object.defineProperty(document, "modelContext", {
    configurable: true,
    value: modelContext,
  });
}

function createModelContext(
  registerTool: WebMCP.ModelContext["registerTool"],
): WebMCP.ModelContext {
  return { registerTool } as unknown as WebMCP.ModelContext;
}

afterEach(() => {
  setModelContext(undefined);
});

describe("App", () => {
  it("opens on a branded Nomsa summary with reset available", () => {
    setModelContext(undefined);
    render(<App />);

    expect(
      screen.getByRole("heading", { name: /hey nomsa/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Jem Unlocked")).toBeInTheDocument();
    expect(screen.getByText(/school fees/i)).toBeInTheDocument();
    expect(screen.getByText(/42%/i)).toBeInTheDocument();
    expect(screen.getByText("WebMCP is unavailable")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /reset demo/i })).toBeEnabled();

    fireEvent.click(screen.getByRole("button", { name: "Employer Hub" }));
    expect(
      screen.getByRole("button", { name: "Employer Hub" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("Sipho Khumalo")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /reset demo/i }));
    expect(screen.getByRole("button", { name: "Employee" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByText("Nomsa Dlamini")).toBeInTheDocument();
  });

  it("registers only the active employee surface, without churn on ordinary transitions, and aborts it on unmount", async () => {
    const registerTool = vi.fn<WebMCP.ModelContext["registerTool"]>();
    registerTool.mockResolvedValue(undefined);
    setModelContext(createModelContext(registerTool));

    const view = render(<App />);

    expect(
      await screen.findByText("WebMCP is ready with 6 tools."),
    ).toBeInTheDocument();
    expect(registerTool.mock.calls.map(([tool]) => tool.name)).toEqual([
      "get_app_status",
      "get_employee_dashboard",
      "update_savings_goal",
      "list_employee_opportunities",
      "request_shift",
      "allocate_reward",
    ]);
    const signals = registerTool.mock.calls.map(
      ([, options]) => options?.signal,
    );
    expect(new Set(signals).size).toBe(1);
    expect(signals[0]?.aborted).toBe(false);

    // Moving between tabs inside a mode must not re-register anything.
    fireEvent.click(screen.getByRole("tab", { name: "Shifts" }));
    fireEvent.click(screen.getByRole("tab", { name: "Rewards" }));
    await waitFor(() => expect(registerTool).toHaveBeenCalledTimes(6));
    expect(signals[0]?.aborted).toBe(false);

    view.unmount();
    expect(signals[0]?.aborted).toBe(true);
  });

  it("swaps the registered surface when the mode changes, so no employee-private tool stays callable", async () => {
    const registerTool = vi.fn<WebMCP.ModelContext["registerTool"]>();
    registerTool.mockResolvedValue(undefined);
    setModelContext(createModelContext(registerTool));

    render(<App />);

    expect(
      await screen.findByText("WebMCP is ready with 6 tools."),
    ).toBeInTheDocument();
    const employeeSignal = registerTool.mock.calls[0]?.[1]?.signal;
    registerTool.mockClear();

    fireEvent.click(screen.getByRole("button", { name: "Employer Hub" }));

    expect(
      await screen.findByText("WebMCP is ready with 7 tools."),
    ).toBeInTheDocument();

    // The employee registration is torn down, not merely shadowed.
    expect(employeeSignal?.aborted).toBe(true);

    const employerTools = registerTool.mock.calls.map(([tool]) => tool.name);
    expect(employerTools).toEqual([
      "get_app_status",
      "get_employer_dashboard",
      "list_programmes",
      "create_opportunity_draft",
      "validate_opportunity",
      "list_open_shifts",
      "list_fairness_exceptions",
    ]);
    expect(employerTools).not.toContain("get_employee_dashboard");
    expect(employerTools).not.toContain("update_savings_goal");
  });

  it("contains registration errors behind a non-sensitive readiness state", async () => {
    const registerTool = vi.fn<WebMCP.ModelContext["registerTool"]>();
    registerTool.mockRejectedValue(
      new Error("browser secret that must not reach the UI"),
    );
    setModelContext(createModelContext(registerTool));

    render(<App />);

    expect(
      await screen.findByText("WebMCP needs attention"),
    ).toBeInTheDocument();
    expect(screen.queryByText(/browser secret/i)).not.toBeInTheDocument();
  });

  it("renders one main landmark in completed and onboarding modes", () => {
    const completedStore = createDemoStore();
    const onboardingState = createInitialDemoState();
    const onboardingStore = createDemoStore({
      ...onboardingState,
      onboarding: { completed: false, step: 1 },
    });

    const completedView = render(
      <DemoProvider store={completedStore}>
        <AppShell />
      </DemoProvider>,
    );
    expect(screen.getAllByRole("main")).toHaveLength(1);

    completedView.unmount();
    render(
      <DemoProvider store={onboardingStore}>
        <AppShell />
      </DemoProvider>,
    );
    expect(
      screen.getByRole("heading", { name: /confirm your employment details/i }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("main")).toHaveLength(1);
  });
});
