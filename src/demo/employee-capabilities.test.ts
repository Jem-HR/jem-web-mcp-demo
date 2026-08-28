import { describe, expect, it } from "vitest";
import { createEmployeeCapabilities } from "./employee-capabilities";
import { createDemoStore } from "./store";

describe("employee capabilities", () => {
  it("reads the dashboard without returning exact expenses", () => {
    const result = createEmployeeCapabilities(createDemoStore()).getDashboard();

    expect(result).toMatchObject({ ok: true, status: "read" });
    expect(JSON.stringify(result)).not.toContain("dependants");
  });

  it("previews then applies a valid goal update", () => {
    const store = createDemoStore();
    const capabilities = createEmployeeCapabilities(store);
    const input = {
      name: "December Fund",
      emoji: "✨",
      targetAmount: 8000,
      savedAmount: 2520,
      targetDate: "2026-12-01",
      monthlyContribution: 500,
      isPrivate: true,
    };

    expect(
      capabilities.updateSavingsGoal({ ...input, confirm: false }),
    ).toMatchObject({
      ok: true,
      status: "preview",
    });
    expect(store.getState().employee.goal.name).toBe("School Fees");

    expect(
      capabilities.updateSavingsGoal({ ...input, confirm: true }),
    ).toMatchObject({
      ok: true,
      status: "applied",
    });
    expect(store.getState().employee.goal.name).toBe("December Fund");
    expect(store.getState().activity?.source).toBe("webmcp");
  });

  it("makes shift requests idempotent and rejects unavailable rewards", () => {
    const capabilities = createEmployeeCapabilities(createDemoStore());

    expect(
      capabilities.requestShift({
        shiftId: "shift-sat-rosebank",
        confirm: true,
      }),
    ).toMatchObject({
      ok: true,
      status: "applied",
    });
    expect(
      capabilities.requestShift({
        shiftId: "shift-sat-rosebank",
        confirm: true,
      }),
    ).toMatchObject({
      ok: true,
      status: "applied",
      data: { alreadyRequested: true },
    });
    expect(
      capabilities.allocateReward({
        rewardId: "reward-reliability",
        destination: "savings",
        confirm: true,
      }),
    ).toMatchObject({
      ok: false,
      error: { code: "REWARD_NOT_EARNED" },
    });
  });

  it("validates and updates employee-only expenses through the capability", () => {
    const store = createDemoStore();
    const capabilities = createEmployeeCapabilities(store);

    expect(
      capabilities.updateExpenses(
        { ...store.getState().employee.expenses, food: -1 },
        "ui",
      ),
    ).toMatchObject({
      ok: false,
      error: { code: "INVALID_INPUT" },
    });
    expect(
      capabilities.updateExpenses(
        { ...store.getState().employee.expenses, food: 850 },
        "ui",
      ),
    ).toMatchObject({
      ok: true,
      status: "applied",
    });
    expect(store.getState().employee.expenses.food).toBe(850);
  });
});
