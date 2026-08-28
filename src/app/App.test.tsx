import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { App } from "./App";

describe("App", () => {
  it("opens on a branded Nomsa summary with reset available", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", { name: /hey nomsa/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Jem Unlocked")).toBeInTheDocument();
    expect(screen.getByText(/school fees/i)).toBeInTheDocument();
    expect(screen.getByText(/42%/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /reset demo/i })).toBeEnabled();
  });
});
