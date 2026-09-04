import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DemoProvider } from "../demo/DemoProvider";
import type { DemoCapabilities } from "../demo/capabilities";
import { createInitialDemoState } from "../demo/fixtures";
import { createDemoStore } from "../demo/store";
import type { DemoState } from "../demo/types";
import { createWebMcpTools } from "../webmcp/tools";
import { App } from "./App";
import { AppShell } from "./AppShell";

function setModelContext(modelContext: WebMCP.ModelContext | undefined) {
  Object.defineProperty(document, "modelContext", {
    configurable: true,
    value: modelContext,
  });
}

function executeTool(tool: WebMCP.ModelContextTool, input: unknown) {
  return tool.execute(input as Record<string, unknown>, {
    signal: new AbortController().signal,
  });
}

function toolByName(
  capabilities: DemoCapabilities,
  name: string,
): WebMCP.ModelContextTool {
  const tool = createWebMcpTools(capabilities).find(
    (candidate) => candidate.name === name,
  );
  if (tool === undefined) throw new Error(`Missing ${name}.`);
  return tool;
}

afterEach(() => {
  setModelContext(undefined);
});

describe("App integration", () => {
  it("reflects only a confirmed WebMCP goal mutation in the visible dashboard and named activity region", async () => {
    let capabilities: DemoCapabilities | null = null;
    render(
      <DemoProvider
        exposeCapabilities={(value) => {
          capabilities = value;
        }}
      >
        <AppShell />
      </DemoProvider>,
    );

    expect(
      screen.getByRole("heading", { name: "School Fees" }),
    ).toBeInTheDocument();
    const updateGoal = toolByName(capabilities!, "update_savings_goal");
    const input = {
      name: "December Fund",
      targetAmount: 8000,
      savedAmount: 2520,
      targetDate: "2026-12-01",
      monthlyContribution: 500,
      isPrivate: true,
      confirm: false,
    };

    await act(async () => {
      await expect(executeTool(updateGoal, input)).resolves.toMatchObject({
        ok: true,
        status: "preview",
      });
    });

    expect(
      screen.getByRole("heading", { name: "School Fees" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("status", { name: /latest activity/i }),
    ).toBeEmptyDOMElement();

    await act(async () => {
      await expect(
        executeTool(updateGoal, { ...input, confirm: true }),
      ).resolves.toMatchObject({ ok: true, status: "applied" });
    });

    expect(
      screen.getByRole("heading", { name: "December Fund" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("status", { name: /latest activity/i }),
    ).toHaveTextContent("WebMCP: Savings goal updated.");
  });

  it("exposes the stable live capability facade once per stable callback", () => {
    const store = createDemoStore();
    const exposeCapabilities = vi.fn<(value: DemoCapabilities) => void>();
    render(
      <DemoProvider exposeCapabilities={exposeCapabilities} store={store}>
        <AppShell />
      </DemoProvider>,
    );

    expect(exposeCapabilities).toHaveBeenCalledOnce();
    const exposed = exposeCapabilities.mock.calls[0]?.[0];
    expect(exposed).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "Employer Hub" }));
    fireEvent.click(screen.getByRole("button", { name: "Employee" }));

    expect(exposeCapabilities).toHaveBeenCalledOnce();
    expect(exposed?.employee.getDashboard()).toMatchObject({
      ok: true,
      data: { employeeName: "Nomsa Dlamini" },
    });
    act(() => {
      expect(
        exposed?.employee.requestShift({
          shiftId: "shift-sat-rosebank",
          confirm: true,
        }),
      ).toMatchObject({ ok: true, status: "applied" });
    });
    expect(exposed?.employee.getDashboard()).toMatchObject({
      ok: true,
      data: { requestedShiftCount: 2 },
    });
    expect(
      screen.getByRole("status", { name: "Latest activity" }),
    ).toHaveTextContent("WebMCP: Requested an additional shift.");
    expect("demoCapabilities" in window).toBe(false);
  });

  it("synchronises one employee tool request with employer applications", async () => {
    let capabilities: DemoCapabilities | null = null;
    render(
      <DemoProvider
        exposeCapabilities={(value) => {
          capabilities = value;
        }}
      >
        <AppShell />
      </DemoProvider>,
    );
    const requestShift = toolByName(capabilities!, "request_shift");

    await act(async () => {
      await executeTool(requestShift, {
        shiftId: "shift-sat-rosebank",
        confirm: true,
      });
      await executeTool(requestShift, {
        shiftId: "shift-sat-rosebank",
        confirm: true,
      });
    });

    fireEvent.click(screen.getByRole("button", { name: "Employer Hub" }));
    fireEvent.click(screen.getByRole("tab", { name: "Manage Shifts" }));
    const shiftCard = screen
      .getByRole("heading", { name: "Sales Floor · Rosebank Mall" })
      .closest<HTMLElement>(".card");
    expect(shiftCard).not.toBeNull();
    expect(
      within(shiftCard!).getByText("4 applications · 2 places"),
    ).toBeInTheDocument();
  });

  it("renders persisted WebMCP opportunity draft and validation state in Employer Hub", async () => {
    let capabilities: DemoCapabilities | null = null;
    render(
      <DemoProvider
        exposeCapabilities={(value) => {
          capabilities = value;
        }}
      >
        <AppShell />
      </DemoProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Employer Hub" }));
    fireEvent.click(screen.getByRole("tab", { name: "Create Opportunity" }));

    expect(
      screen.queryByRole("region", { name: "Saved opportunity draft" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("region", { name: "Programme validation" }),
    ).not.toBeInTheDocument();

    const createDraft = toolByName(capabilities!, "create_opportunity_draft");
    const validateDraft = toolByName(capabilities!, "validate_opportunity");
    const draftInput = {
      name: "October Reliability Reward",
      type: "attendance",
      outcome: "Reward on-time attendance during October",
      eligibleSegment: "Rosebank retail employees",
      qualificationRule: "Arrive on time for every confirmed October shift",
      startDate: "2026-10-01",
      endDate: "2026-10-31",
      rewardType: "cash",
      rewardAmount: 250,
      totalBudget: 105000,
      maxPerEmployee: 250,
      exceptionPolicy:
        "Approved leave and employer roster changes enter review",
      confirm: false,
    };

    await act(async () => {
      await expect(executeTool(createDraft, draftInput)).resolves.toMatchObject(
        {
          ok: true,
          status: "preview",
        },
      );
    });

    expect(
      screen.queryByRole("region", { name: "Saved opportunity draft" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("region", { name: "Programme validation" }),
    ).not.toBeInTheDocument();

    await act(async () => {
      await expect(
        executeTool(createDraft, { ...draftInput, confirm: true }),
      ).resolves.toMatchObject({ ok: true, status: "applied" });
    });

    const savedDraft = screen.getByRole("region", {
      name: "Saved opportunity draft",
    });
    for (const value of [
      draftInput.name,
      draftInput.type,
      draftInput.outcome,
      draftInput.eligibleSegment,
      draftInput.qualificationRule,
      draftInput.exceptionPolicy,
      `${draftInput.startDate} to ${draftInput.endDate}`,
    ]) {
      expect(within(savedDraft).getByText(value)).toBeInTheDocument();
    }
    expect(within(savedDraft).getByText(/R\s*250 cash/i)).toBeInTheDocument();
    expect(within(savedDraft).getByText(/R\s*105\s*000/)).toBeInTheDocument();
    expect(within(savedDraft).getAllByText(/R\s*250/)).toHaveLength(2);
    expect(
      screen.getByRole("status", { name: "Latest activity" }),
    ).toHaveTextContent("WebMCP: Saved opportunity draft.");
    expect(screen.queryByText("School Fees")).not.toBeInTheDocument();
    expect(screen.queryByText(/R\s*2\s*520/)).not.toBeInTheDocument();

    await act(async () => {
      await expect(
        executeTool(validateDraft, { draftId: "draft-opportunity" }),
      ).resolves.toMatchObject({ ok: true, status: "applied" });
    });

    const validation = screen.getByRole("region", {
      name: "Programme validation",
    });
    expect(within(validation).getByText("Review required")).toBeInTheDocument();
    const fairness =
      within(validation).getByText("Fairness passed").parentElement;
    expect(fairness).not.toBeNull();
    expect(within(fairness!).getByText("No")).toBeInTheDocument();
    expect(within(validation).getByText("3 unresolved")).toBeInTheDocument();
  });

  it("supports wrapping arrow, Home, and End tab navigation with selection following focus", () => {
    render(<App />);
    const overview = screen.getByRole("tab", { name: "Overview" });
    overview.focus();

    fireEvent.keyDown(overview, { key: "ArrowRight" });
    const shifts = screen.getByRole("tab", { name: "Shifts" });
    expect(shifts).toHaveFocus();
    expect(shifts).toHaveAttribute("aria-selected", "true");

    fireEvent.keyDown(shifts, { key: "Home" });
    expect(overview).toHaveFocus();
    expect(overview).toHaveAttribute("aria-selected", "true");

    fireEvent.keyDown(overview, { key: "ArrowLeft" });
    const rewards = screen.getByRole("tab", { name: "Rewards" });
    expect(rewards).toHaveFocus();
    expect(rewards).toHaveAttribute("aria-selected", "true");

    fireEvent.keyDown(rewards, { key: "Home" });
    fireEvent.keyDown(overview, { key: "End" });
    expect(rewards).toHaveFocus();
    expect(rewards).toHaveAttribute("tabindex", "0");
    expect(
      screen
        .getAllByRole("tab")
        .filter((tab) => tab.getAttribute("tabindex") === "0"),
    ).toHaveLength(1);

    const panel = screen.getByRole("tabpanel");
    expect(panel).toHaveAttribute("aria-labelledby", rewards.id);
    expect(rewards).toHaveAttribute("aria-controls", panel.id);
  });

  it("derives profile, goal, counts, next action, and action names from injected state", () => {
    const initial = createInitialDemoState();
    const [confirmedFixture, availableFixture, requestedFixture] =
      initial.employee.shifts;
    const customState: DemoState = {
      ...initial,
      employee: {
        ...initial.employee,
        profile: {
          ...initial.employee.profile,
          firstName: "Ayo",
          fullName: "Ayo Mbeki",
          employerName: "Market Co",
          role: "Night Auditor",
        },
        goal: {
          ...initial.employee.goal,
          name: "Emergency Buffer",
          targetAmount: 10000,
          savedAmount: 2500,
        },
        shifts: [
          {
            ...confirmedFixture!,
            id: "opaque-confirmed",
            date: "2026-09-07",
            status: "confirmed",
          },
          {
            ...availableFixture!,
            id: "shift-sun-rosebank",
            date: "2026-09-08",
            role: "Stocktake Specialist",
            site: "Cape Town Civic Centre",
            status: "available",
          },
          {
            ...requestedFixture!,
            id: "opaque-requested",
            date: "2026-09-09",
            status: "requested",
          },
        ],
      },
    };

    render(
      <DemoProvider store={createDemoStore(customState)}>
        <AppShell />
      </DemoProvider>,
    );

    expect(
      screen.getByRole("heading", { name: /hey ayo/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Market Co · Night Auditor")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Emergency Buffer" }),
    ).toBeInTheDocument();
    const metrics = screen.getByRole("region", { name: "Pay and shifts" });
    expect(
      within(metrics).getByText("1 requested · 1 available"),
    ).toBeVisible();
    expect(
      screen.getByRole("heading", {
        name: "Stocktake Specialist at Cape Town Civic Centre",
      }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "Shifts" }));
    expect(
      screen.getByRole("button", {
        name: "Request Tuesday Stocktake Specialist shift at Cape Town Civic Centre",
      }),
    ).toBeEnabled();
  });

  it("aligns every fixture shift date with its canonical weekday identity", () => {
    expect(
      createInitialDemoState().employee.shifts.map(({ id, date }) => [
        id,
        date,
      ]),
    ).toEqual([
      ["shift-mon-rosebank", "2026-08-31"],
      ["shift-tue-rosebank", "2026-09-01"],
      ["shift-wed-rosebank", "2026-09-02"],
      ["shift-fri-rosebank", "2026-09-04"],
      ["shift-sat-rosebank", "2026-09-05"],
      ["shift-thu-sandton", "2026-09-03"],
      ["shift-sun-rosebank", "2026-09-06"],
    ]);
  });
});
