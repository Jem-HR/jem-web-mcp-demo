import { describe, expect, it } from "vitest";
import { createDemoCapabilities } from "./capabilities";
import { createDemoStore } from "./store";

describe("employer privacy boundary", () => {
  it("never serialises protected employee financial fields or goal values", () => {
    const employer = createDemoCapabilities(createDemoStore()).employer;
    const payloads = [
      employer.getDashboard(),
      employer.listProgrammes(),
      employer.listOpenShifts(),
      employer.listFairnessExceptions(),
    ];
    const serialised = JSON.stringify(payloads);

    for (const protectedValue of [
      "housing",
      "transport",
      "food",
      "dependants",
      "debt",
      "airtime",
      "other",
      "targetAmount",
      "savedAmount",
      "targetDate",
      "monthlyContribution",
      "isPrivate",
      "School Fees",
      "🎓",
      "6000",
      "2520",
      "2026-12-01",
      "400",
    ]) {
      expect(serialised).not.toContain(protectedValue);
    }
  });
});
