import { getAppStatus } from "../app/app-status";

export const getAppStatusTool = {
  name: "get_app_status",
  title: "Get application status",
  description:
    "Read the current foundation status of the Jem WebMCP Demo without changing application state.",
  inputSchema: {
    type: "object",
    properties: {},
    additionalProperties: false,
  },
  annotations: {
    readOnlyHint: true,
  },
  async execute(input) {
    if (
      typeof input !== "object" ||
      input === null ||
      Array.isArray(input) ||
      Object.keys(input).length > 0
    ) {
      throw new TypeError("get_app_status does not accept input properties.");
    }

    return getAppStatus();
  },
} satisfies WebMCP.ModelContextTool;

export const webMcpTools: readonly WebMCP.ModelContextTool[] = [
  getAppStatusTool,
];
