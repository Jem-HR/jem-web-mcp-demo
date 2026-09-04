export interface AppStatus {
  name: "Jem Unlocked";
  phase: "prototype";
  webMcpReady: true;
}

export function getAppStatus(): AppStatus {
  return {
    name: "Jem Unlocked",
    phase: "prototype",
    webMcpReady: true,
  };
}
