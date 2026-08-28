import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DemoProvider } from "../demo/DemoProvider";
import { GoalEditorDialog } from "./GoalEditorDialog";

describe("GoalEditorDialog", () => {
  it("applies an edited goal through the employee capability", () => {
    render(
      <DemoProvider>
        <GoalEditorDialog open onClose={() => undefined} />
      </DemoProvider>,
    );

    fireEvent.change(screen.getByLabelText(/goal name/i), {
      target: { value: "December Fund" },
    });
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

    expect(screen.getByDisplayValue("December Fund")).toBeInTheDocument();
  });

  it("updates the goal name from a named goal choice", () => {
    render(
      <DemoProvider>
        <GoalEditorDialog open onClose={() => undefined} />
      </DemoProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Emergency Fund" }));

    expect(screen.getByDisplayValue("Emergency Fund")).toBeInTheDocument();
  });
});
