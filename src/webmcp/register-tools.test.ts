import { describe, expect, it, vi } from "vitest";

import { registerWebMcpTools } from "./register-tools";
import { webMcpTools } from "./tools";

function createModelContext(
  registerTool: WebMCP.ModelContext["registerTool"],
): WebMCP.ModelContext {
  return { registerTool } as WebMCP.ModelContext;
}

describe("registerWebMcpTools", () => {
  it("reports unsupported without attempting registration", () => {
    const onStatus = vi.fn();

    const dispose = registerWebMcpTools(undefined, onStatus);

    expect(onStatus).toHaveBeenCalledOnce();
    expect(onStatus).toHaveBeenCalledWith({ state: "unsupported" });
    expect(() => dispose()).not.toThrow();
  });

  it("registers every tool and reports readiness", async () => {
    const registerTool = vi.fn<WebMCP.ModelContext["registerTool"]>();
    registerTool.mockResolvedValue(undefined);
    const onStatus = vi.fn();

    registerWebMcpTools(createModelContext(registerTool), onStatus);

    expect(onStatus).toHaveBeenNthCalledWith(1, { state: "registering" });
    await vi.waitFor(() => {
      expect(onStatus).toHaveBeenLastCalledWith({
        state: "ready",
        toolCount: webMcpTools.length,
      });
    });
    expect(registerTool).toHaveBeenCalledTimes(webMcpTools.length);
  });

  it("aborts the shared registration signal during cleanup", () => {
    const registerTool = vi.fn<WebMCP.ModelContext["registerTool"]>();
    registerTool.mockResolvedValue(undefined);
    const onStatus = vi.fn();

    const dispose = registerWebMcpTools(
      createModelContext(registerTool),
      onStatus,
    );
    const options = registerTool.mock.calls[0]?.[1];

    expect(options?.signal?.aborted).toBe(false);
    dispose();
    expect(options?.signal?.aborted).toBe(true);
  });

  it("contains registration failures behind a non-sensitive status", async () => {
    const registerTool = vi.fn<WebMCP.ModelContext["registerTool"]>();
    registerTool.mockRejectedValue(new Error("browser-internal details"));
    const onStatus = vi.fn();

    registerWebMcpTools(createModelContext(registerTool), onStatus);

    await vi.waitFor(() => {
      expect(onStatus).toHaveBeenLastCalledWith({
        state: "error",
        message: "WebMCP tool registration failed.",
      });
    });
  });
});
