import { useEffect, useState } from "react";

import { registerWebMcpTools } from "./register-tools";
import type { WebMcpStatus } from "./types";

export function useWebMcpStatus(): WebMcpStatus {
  const [status, setStatus] = useState<WebMcpStatus>({ state: "registering" });

  useEffect(() => {
    return registerWebMcpTools(document.modelContext, setStatus);
  }, []);

  return status;
}
