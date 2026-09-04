export type WebMcpStatus =
  | { state: "registering" }
  | { state: "ready"; toolCount: number }
  | { state: "unsupported" }
  | { state: "error"; message: string };
