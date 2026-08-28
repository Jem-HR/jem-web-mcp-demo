import { useEffect, useId, useRef, type ReactNode } from "react";

export interface DialogProps {
  open: boolean;
  title: string;
  onClose(): void;
  children: ReactNode;
  footer?: ReactNode;
}

const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

export function Dialog({
  children,
  footer,
  onClose,
  open,
  title,
}: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const lastInteractedRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  const headingId = useId();

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    function recordInteraction(event: MouseEvent) {
      if (event.target instanceof HTMLElement) {
        lastInteractedRef.current = event.target;
      }
    }

    document.addEventListener("click", recordInteraction);
    return () => document.removeEventListener("click", recordInteraction);
  }, []);

  useEffect(() => {
    if (!open) return;

    const activeElement = document.activeElement;
    previouslyFocusedRef.current =
      activeElement instanceof HTMLElement && activeElement !== document.body
        ? activeElement
        : lastInteractedRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }

      if (event.key !== "Tab") return;

      const focusable = Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(focusableSelector) ??
          [],
      );
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable.at(-1)!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      if (previouslyFocusedRef.current?.isConnected) {
        previouslyFocusedRef.current.focus();
      }
      previouslyFocusedRef.current = null;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="dialog-backdrop"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        aria-labelledby={headingId}
        aria-modal="true"
        className="dialog"
        ref={dialogRef}
        role="dialog"
      >
        <header className="dialog__header">
          <h2 id={headingId}>{title}</h2>
          <button
            aria-label="Close dialog"
            className="dialog__close"
            onClick={onClose}
            ref={closeButtonRef}
            type="button"
          >
            ×
          </button>
        </header>
        <div className="dialog__content">{children}</div>
        {footer ? <footer className="dialog__footer">{footer}</footer> : null}
      </div>
    </div>
  );
}
