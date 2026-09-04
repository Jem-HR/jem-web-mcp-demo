import { act, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";

import {
  DemoProvider,
  useDemoCapabilities,
  useDemoSelector,
  useDemoStore,
} from "./DemoProvider";

function renderWithProvider(children: ReactNode) {
  return render(<DemoProvider>{children}</DemoProvider>);
}

describe("DemoProvider", () => {
  it("requires a provider for every shared hook", () => {
    function StoreConsumer() {
      useDemoStore();
      return null;
    }
    function CapabilityConsumer() {
      useDemoCapabilities();
      return null;
    }
    function SelectorConsumer() {
      useDemoSelector((state) => state.mode);
      return null;
    }

    expect(() => render(<StoreConsumer />)).toThrow(
      "DemoProvider is required.",
    );
    expect(() => render(<CapabilityConsumer />)).toThrow(
      "DemoProvider is required.",
    );
    expect(() => render(<SelectorConsumer />)).toThrow(
      "DemoProvider is required.",
    );
  });

  it("starts from the reviewed initial demo state", () => {
    function StateConsumer() {
      const summary = useDemoSelector((state) => ({
        mode: state.mode,
        onboardingComplete: state.onboarding.completed,
        name: state.employee.profile.firstName,
      }));
      return <output>{JSON.stringify(summary)}</output>;
    }

    renderWithProvider(<StateConsumer />);

    expect(screen.getByRole("status")).toHaveTextContent(
      '{"mode":"employee","onboardingComplete":true,"name":"Nomsa"}',
    );
  });

  it("updates selector consumers while capabilities keep their identity", () => {
    let initialCapabilities: ReturnType<typeof useDemoCapabilities> | null =
      null;

    function StoreConsumer() {
      const store = useDemoStore();
      const mode = useDemoSelector((state) => state.mode);
      const capabilities = useDemoCapabilities();
      initialCapabilities ??= capabilities;

      return (
        <>
          <output aria-label="mode">{mode}</output>
          <output aria-label="capabilities-stable">
            {String(capabilities === initialCapabilities)}
          </output>
          <button
            onClick={() =>
              store.dispatch({ type: "navigation/set-mode", mode: "employer" })
            }
          >
            Switch mode
          </button>
        </>
      );
    }

    renderWithProvider(<StoreConsumer />);
    act(() => {
      screen.getByRole("button", { name: "Switch mode" }).click();
    });

    expect(screen.getByLabelText("mode")).toHaveTextContent("employer");
    expect(screen.getByLabelText("capabilities-stable")).toHaveTextContent(
      "true",
    );
  });
});
