import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import { Dialog } from "./Dialog";

describe("Dialog", () => {
  it("labels, closes, and restores focus", () => {
    const onClose = vi.fn();

    function Harness() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button onClick={() => setOpen(true)}>Open editor</button>
          <Dialog
            open={open}
            title="Edit goal"
            onClose={() => {
              onClose();
              setOpen(false);
            }}
          >
            <button>Save</button>
          </Dialog>
        </>
      );
    }

    render(<Harness />);
    const trigger = screen.getByRole("button", { name: "Open editor" });
    fireEvent.click(trigger);

    expect(
      screen.getByRole("dialog", { name: "Edit goal" }),
    ).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });

    expect(onClose).toHaveBeenCalledOnce();
    expect(trigger).toHaveFocus();
  });
});
