import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { App } from "../app/App";

describe("OnboardingFlow", () => {
  it("moves through confirmation, goal, expenses, and plan steps", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /reset demo/i }));
    fireEvent.click(
      screen.getByRole("button", { name: /details are correct/i }),
    );
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));

    expect(
      screen.getByRole("heading", { name: /set your goal/i }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /school fees/i }));
    fireEvent.change(screen.getByLabelText(/target amount/i), {
      target: { value: "6000" },
    });
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));

    expect(
      screen.getByRole("heading", { name: /monthly expenses/i }),
    ).toBeInTheDocument();
  });
});
