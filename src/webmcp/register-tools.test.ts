import { describe, expect, it, vi } from "vitest";

import { createDemoCapabilities } from "../demo/capabilities";
import { createDemoStore } from "../demo/store";
import { registerWebMcpTools } from "./register-tools";
import { createWebMcpTools } from "./tools";

const tools = createWebMcpTools(createDemoCapabilities(createDemoStore()));

function createModelContext(
  registerTool: WebMCP.ModelContext["registerTool"],
): WebMCP.ModelContext {
  return { registerTool } as WebMCP.ModelContext;
}

describe("registerWebMcpTools", () => {
  it("reports unsupported when registerTool is unavailable", () => {
    const unsupportedContexts = [
      undefined,
      {},
      { registerTool: "not a function" },
    ];

    for (const modelContext of unsupportedContexts) {
      const onStatus = vi.fn();
      const dispose = registerWebMcpTools(
        modelContext as WebMCP.ModelContext | undefined,
        onStatus,
        tools,
      );

      expect(onStatus).toHaveBeenCalledOnce();
      expect(onStatus).toHaveBeenCalledWith({ state: "unsupported" });
      expect(() => dispose()).not.toThrow();
    }
  });

  it("registers every tool and reports readiness", async () => {
    const registerTool = vi.fn<WebMCP.ModelContext["registerTool"]>();
    registerTool.mockResolvedValue(undefined);
    const onStatus = vi.fn();

    registerWebMcpTools(createModelContext(registerTool), onStatus, tools);

    expect(onStatus).toHaveBeenNthCalledWith(1, { state: "registering" });
    await vi.waitFor(() => {
      expect(onStatus).toHaveBeenLastCalledWith({
        state: "ready",
        toolCount: 12,
      });
    });
    expect(registerTool).toHaveBeenCalledTimes(12);
  });

  it("aborts the shared registration signal during cleanup", () => {
    const registerTool = vi.fn<WebMCP.ModelContext["registerTool"]>();
    registerTool.mockResolvedValue(undefined);
    const onStatus = vi.fn();

    const dispose = registerWebMcpTools(
      createModelContext(registerTool),
      onStatus,
      tools,
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

    registerWebMcpTools(createModelContext(registerTool), onStatus, tools);
    const signal = registerTool.mock.calls[0]?.[1]?.signal;

    await vi.waitFor(() => {
      expect(onStatus).toHaveBeenLastCalledWith({
        state: "error",
        message: "WebMCP tool registration failed.",
      });
    });
    expect(signal?.aborted).toBe(true);
  });

  it("contains earlier rejected registrations when a later registration throws", async () => {
    const registerTool = vi.fn<WebMCP.ModelContext["registerTool"]>();
    let rejectRegistration: (reason?: unknown) => void = () => undefined;
    const rejectedRegistration = new Promise<void>((_resolve, reject) => {
      rejectRegistration = reject;
    });
    const rejectedThen = vi.spyOn(rejectedRegistration, "then");
    registerTool
      .mockImplementationOnce(() => rejectedRegistration)
      .mockImplementationOnce(() => {
        throw new Error("second browser-internal detail");
      });
    const onStatus = vi.fn();

    registerWebMcpTools(createModelContext(registerTool), onStatus, [
      tools[0],
      tools[0],
    ]);
    const firstSignal = registerTool.mock.calls[0]?.[1]?.signal;
    const secondSignal = registerTool.mock.calls[1]?.[1]?.signal;

    expect(onStatus).toHaveBeenLastCalledWith({
      state: "error",
      message: "WebMCP tool registration failed.",
    });
    expect(firstSignal).toBe(secondSignal);
    expect(firstSignal?.aborted).toBe(true);
    expect(rejectedThen).toHaveBeenCalled();
    rejectRegistration(new Error("first browser-internal detail"));
    await vi.waitFor(() => {
      expect(registerTool).toHaveBeenCalledTimes(2);
    });
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
});
