import { getAppStatus } from "../app/app-status";
import type { DemoCapabilities } from "../demo/capabilities";
import type { AppMode } from "../demo/types";
import { createEmployeeTools } from "./employee-tools";
import { createEmployerTools } from "./employer-tools";
import { assertClosedObject, safeToolExecute } from "./tool-helpers";

export const getAppStatusTool = {
  name: "get_app_status",
  title: "Get application status",
  description:
    "Read the completed Jem Unlocked prototype status without changing application state.",
  inputSchema: {
    type: "object",
    properties: {},
    required: [],
    additionalProperties: false,
  },
  annotations: {
    readOnlyHint: true,
  },
  async execute(input) {
    return safeToolExecute(() => {
      assertClosedObject(input, [], "get_app_status");
      return getAppStatus();
    });
  },
} satisfies WebMCP.ModelContextTool;

/**
 * The complete tool catalogue. Used for documentation and coverage tests; it is
 * deliberately not what the page exposes at any single moment.
 */
export function createWebMcpTools(
  capabilities: DemoCapabilities,
): readonly WebMCP.ModelContextTool[] {
  return [
    getAppStatusTool,
    ...createEmployeeTools(capabilities.employee),
    ...createEmployerTools(capabilities.employer),
  ];
}

/**
 * The tools actually registered for the mode currently on screen.
 *
 * Scoping registration to the active mode is the privacy boundary an agent
 * cannot argue with: while the employer experience is open, no employee-private
 * tool is registered, so `document.modelContext` has nothing to call. This is
 * enforcement the page can provide and a server-side tool host cannot.
 */
export function createExposedWebMcpTools(
  capabilities: DemoCapabilities,
  mode: AppMode,
): readonly WebMCP.ModelContextTool[] {
  return [
    getAppStatusTool,
    ...(mode === "employee"
      ? createEmployeeTools(capabilities.employee)
      : createEmployerTools(capabilities.employer)),
  ];
}
