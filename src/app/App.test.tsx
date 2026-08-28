import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { App } from "./App";

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
  it("renders the neutral WebMCP foundation shell", () => {
    setModelContext(undefined);
    render(<App />);

    expect(
      screen.getByRole("heading", { name: "Jem WebMCP Demo" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Ready for the Figma handoff."),
    ).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(
      "WebMCP is unavailable in this browser.",
    );
  });

  it("announces readiness after the browser registers the tool", async () => {
    const registerTool = vi.fn<WebMCP.ModelContext["registerTool"]>();
    registerTool.mockResolvedValue(undefined);
    setModelContext({ registerTool } as unknown as WebMCP.ModelContext);

    render(<App />);

    expect(
      await screen.findByText("WebMCP is ready with 1 tool."),
    ).toBeInTheDocument();
  });

  it("shows a non-blocking error when registration fails", async () => {
    const registerTool = vi.fn<WebMCP.ModelContext["registerTool"]>();
    registerTool.mockRejectedValue(new Error("permission denied"));
    setModelContext({ registerTool } as unknown as WebMCP.ModelContext);

    render(<App />);

    expect(
      await screen.findByText("WebMCP tool registration failed."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Jem WebMCP Demo" }),
    ).toBeInTheDocument();
  });
});
