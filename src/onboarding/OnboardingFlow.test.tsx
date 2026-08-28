import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AppShell } from "../app/AppShell";
import { DemoProvider } from "../demo/DemoProvider";
import { createInitialDemoState } from "../demo/fixtures";
import { createDemoStore } from "../demo/store";
import type { DemoStore } from "../demo/types";

function createOnboardingStore(): DemoStore {
  const initialState = createInitialDemoState();
  return createDemoStore({
    ...initialState,
    onboarding: { completed: false, step: 1 },
  });
}

function renderOnboarding(store: DemoStore) {
  return render(
    <DemoProvider store={store}>
      <AppShell />
    </DemoProvider>,
  );
}

describe("OnboardingFlow", () => {
  it("moves through confirmation, goal, expenses, and plan steps", () => {
    const store = createOnboardingStore();
    renderOnboarding(store);

    fireEvent.click(
      screen.getByRole("button", { name: /details are correct/i }),
    );
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));
    expect(
      screen.getByRole("heading", { name: /set your goal/i }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /school fees/i }));
    fireEvent.change(screen.getByLabelText(/goal name/i), {
      target: { value: "December Fund" },
    });
    fireEvent.change(screen.getByLabelText(/target amount/i), {
      target: { value: "6000" },
    });
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));

    expect(
      screen.getByRole("heading", { name: /monthly expenses/i }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /continue/i }));
    expect(
      screen.getByRole("heading", { name: /your plan is ready/i }),
    ).toBeInTheDocument();
    expect(store.getState().activity).toBeNull();
    expect(store.getState().employee.goal.name).toBe("School Fees");

    fireEvent.click(screen.getByRole("button", { name: /open my dashboard/i }));
    expect(store.getState().onboarding.completed).toBe(true);
    expect(store.getState().employee.goal.name).toBe("December Fund");
    expect(
      screen.getByRole("heading", { name: /hey nomsa/i }),
    ).toBeInTheDocument();
  });

  it("keeps onboarding incomplete and shows recovery text when goal update fails", () => {
    const store = createOnboardingStore();
    renderOnboarding(store);

    fireEvent.click(
      screen.getByRole("button", { name: /details are correct/i }),
    );
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));
    fireEvent.change(screen.getByLabelText(/target amount/i), {
      target: { value: "0" },
    });
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));
    fireEvent.click(screen.getByRole("button", { name: /open my dashboard/i }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Provide a name, valid amounts and a future target date.",
    );
    expect(store.getState().onboarding.completed).toBe(false);
    expect(store.getState().activity).toBeNull();
  });

  it("keeps onboarding incomplete and shows recovery text when expense update fails", () => {
    const store = createOnboardingStore();
    renderOnboarding(store);

    fireEvent.click(
      screen.getByRole("button", { name: /details are correct/i }),
    );
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));
    fireEvent.change(screen.getByLabelText(/goal name/i), {
      target: { value: "December Fund" },
    });
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));
    fireEvent.change(screen.getByLabelText(/food/i), {
      target: { value: "-1" },
    });
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));
    fireEvent.click(screen.getByRole("button", { name: /open my dashboard/i }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Provide all seven expense amounts as zero or more.",
    );
    expect(store.getState().onboarding.completed).toBe(false);
    expect(store.getState().employee.goal.name).toBe("December Fund");
    expect(store.getState().activity?.source).toBe("ui");
  });
});
