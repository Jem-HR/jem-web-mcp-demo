import { getAppStatus } from "../app/app-status";
import type { DemoCapabilities } from "../demo/capabilities";
import { createEmployeeTools } from "./employee-tools";
import { createEmployerTools } from "./employer-tools";
import { assertClosedObject } from "./tool-helpers";

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
    assertClosedObject(input, [], "get_app_status");
    return getAppStatus();
  },
} satisfies WebMCP.ModelContextTool;

export function createWebMcpTools(
  capabilities: DemoCapabilities,
): readonly WebMCP.ModelContextTool[] {
  return [
    getAppStatusTool,
    ...createEmployeeTools(capabilities.employee),
    ...createEmployerTools(capabilities.employer),
  ];
}
