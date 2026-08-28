import { webMcpTools } from "./tools";
import type { WebMcpStatus } from "./types";

type StatusListener = (status: WebMcpStatus) => void;

const REGISTRATION_ERROR = "WebMCP tool registration failed.";

export function registerWebMcpTools(
  modelContext: WebMCP.ModelContext | undefined,
  onStatus: StatusListener,
  tools: readonly WebMCP.ModelContextTool[] = webMcpTools,
): () => void {
  if (typeof modelContext?.registerTool !== "function") {
    onStatus({ state: "unsupported" });
    return () => undefined;
  }

  const controller = new AbortController();
  onStatus({ state: "registering" });

  const registrations: Promise<void>[] = [];

  try {
    for (const tool of tools) {
      registrations.push(
        modelContext.registerTool(tool, { signal: controller.signal }),
      );
    }
  } catch {
    controller.abort();
    void Promise.allSettled(registrations);
    onStatus({ state: "error", message: REGISTRATION_ERROR });
    return () => controller.abort();
  }

  void Promise.all(registrations)
    .then(() => {
      if (!controller.signal.aborted) {
        onStatus({ state: "ready", toolCount: tools.length });
      }
    })
    .catch(() => {
      if (!controller.signal.aborted) {
        controller.abort();
        onStatus({ state: "error", message: REGISTRATION_ERROR });
      }
    });

  return () => controller.abort();
}
