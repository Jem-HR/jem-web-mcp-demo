import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

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
