import { describe, expect, it } from "vitest";
import { createDemoCapabilities } from "./capabilities";
import { createDemoStore } from "./store";

const protectedKeys = new Set([
  "goal",
  "expenses",
  "emoji",
  "targetAmount",
  "savedAmount",
  "targetDate",
  "monthlyContribution",
  "isPrivate",
  "housing",
  "transport",
  "food",
  "dependants",
  "debt",
  "airtime",
  "other",
]);

function protectedPaths(value: unknown, path: string[] = []): string[] {
  if (value === null || typeof value !== "object") return [];

  return Object.entries(value).flatMap(([key, child]) => {
    const childPath = [...path, key];
    const keyIsProtected =
      protectedKeys.has(key) || (key === "name" && path.includes("goal"));
    return [
      ...(keyIsProtected ? [childPath.join(".")] : []),
      ...protectedPaths(child, childPath),
    ];
  });
}

describe("employer privacy boundary", () => {
  it("never returns protected employee fields, paths, or whole financial records", () => {
    const store = createDemoStore();
    const employer = createDemoCapabilities(store).employer;
    const payloads = [
      employer.getDashboard(),
      employer.listProgrammes(),
      employer.listOpenShifts(),
      employer.listFairnessExceptions(),
    ];
    const serialised = JSON.stringify(payloads);

    expect(payloads.flatMap((payload) => protectedPaths(payload))).toEqual([]);
    expect(serialised).not.toContain(
      JSON.stringify(store.getState().employee.goal),
    );
    expect(serialised).not.toContain(
      JSON.stringify(store.getState().employee.expenses),
    );
    for (const protectedValue of ["School Fees", "2520", "6000"]) {
      expect(serialised).not.toContain(protectedValue);
    }
  });
});
