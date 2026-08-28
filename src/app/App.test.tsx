import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { App } from "./App";

describe("App", () => {
  it("renders the neutral WebMCP foundation shell", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", { name: "Jem WebMCP Demo" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Ready for the Figma handoff."),
    ).toBeInTheDocument();
  });
});
