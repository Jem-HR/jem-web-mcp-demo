import {
  createEmployeeCapabilities,
  type EmployeeCapabilities,
} from "./employee-capabilities";
import {
  createEmployerCapabilities,
  type EmployerCapabilities,
} from "./employer-capabilities";
import type { DemoStore } from "./types";

export interface DemoCapabilities {
  employee: EmployeeCapabilities;
  employer: EmployerCapabilities;
}

export function createDemoCapabilities(store: DemoStore): DemoCapabilities {
  return {
    employee: createEmployeeCapabilities(store),
    employer: createEmployerCapabilities(store),
  };
}
