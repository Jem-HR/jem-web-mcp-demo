export interface AppStatus {
  name: "Jem WebMCP Demo";
  phase: "foundation";
  webMcpReady: true;
}

export function getAppStatus(): AppStatus {
  return {
    name: "Jem WebMCP Demo",
    phase: "foundation",
    webMcpReady: true,
  };
}
