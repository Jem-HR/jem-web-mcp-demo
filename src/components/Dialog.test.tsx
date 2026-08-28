import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import { Dialog } from "./Dialog";

describe("Dialog", () => {
  it("labels, closes, and restores programmatically focused elements", () => {
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
    trigger.focus();
    fireEvent.click(trigger);

    expect(
      screen.getByRole("dialog", { name: "Edit goal" }),
    ).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });

    expect(onClose).toHaveBeenCalledOnce();
    expect(trigger).toHaveFocus();
  });

  it("restores the actual focused element when a different control opens it", () => {
    function Harness() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button>Return focus here</button>
          <button onClick={() => setOpen(true)}>Open editor</button>
          <Dialog open={open} title="Edit goal" onClose={() => setOpen(false)}>
            <button>Save</button>
          </Dialog>
        </>
      );
    }

    render(<Harness />);
    const returnTarget = screen.getByRole("button", {
      name: "Return focus here",
    });
    returnTarget.focus();
    fireEvent.click(screen.getByRole("button", { name: "Open editor" }));
    fireEvent.keyDown(document, { key: "Escape" });

    expect(returnTarget).toHaveFocus();
  });

  it("does not substitute a clicked trigger when body held focus", () => {
    function Harness() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button onClick={() => setOpen(true)}>Open editor</button>
          <Dialog open={open} title="Edit goal" onClose={() => setOpen(false)}>
            <button>Save</button>
          </Dialog>
        </>
      );
    }

    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: "Open editor" }));
    fireEvent.keyDown(document, { key: "Escape" });

    expect(document.body).toHaveFocus();
  });

  it("traps forward and reverse Tab around controls excluded from tab order", () => {
    render(
      <Dialog open title="Edit goal" onClose={() => undefined}>
        <button>First action</button>
        <button>Last action</button>
        <button tabIndex={-1}>Ignored action</button>
      </Dialog>,
    );

    const close = screen.getByRole("button", { name: "Close dialog" });
    const last = screen.getByRole("button", { name: "Last action" });
    last.focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(close).toHaveFocus();

    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(last).toHaveFocus();
  });

  it("traps Tab around hidden controls at the dialog boundary", () => {
    render(
      <Dialog open title="Edit goal" onClose={() => undefined}>
        <button>First visible action</button>
        <button>Last visible action</button>
        <button hidden>Hidden attribute action</button>
        <button style={{ display: "none" }}>Display none action</button>
        <button style={{ visibility: "hidden" }}>
          Visibility hidden action
        </button>
      </Dialog>,
    );

    const close = screen.getByRole("button", { name: "Close dialog" });
    const last = screen.getByRole("button", { name: "Last visible action" });
    last.focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(close).toHaveFocus();

    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(last).toHaveFocus();
  });

  it("marks dialog content for viewport-constrained scrolling", () => {
    render(
      <Dialog open title="Edit goal" onClose={() => undefined}>
        <p>Long editable content</p>
      </Dialog>,
    );

    expect(screen.getByRole("dialog")).toHaveClass(
      "dialog--viewport-constrained",
    );
    expect(screen.getByText("Long editable content").parentElement).toHaveClass(
      "dialog__content--scrollable",
    );
  });
});
