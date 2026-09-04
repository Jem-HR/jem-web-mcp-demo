import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { App } from "../app/App";
import { AppShell } from "../app/AppShell";
import { DemoProvider } from "../demo/DemoProvider";
import { createInitialDemoState } from "../demo/fixtures";
import { createDemoStore } from "../demo/store";
import type {
  DemoAction,
  DemoStore,
  EmployerTab,
  OpportunityDraft,
  OpportunityValidation,
} from "../demo/types";
import featuresCss from "../styles/features.css?raw";
import { OpportunityValidationCard } from "./OpportunityBuilder";

function setModelContext(modelContext: WebMCP.ModelContext | undefined) {
  Object.defineProperty(document, "modelContext", {
    configurable: true,
    value: modelContext,
  });
}

function renderEmployer() {
  const initial = createInitialDemoState();
  const store = createDemoStore({ ...initial, mode: "employer" });
  render(
    <DemoProvider store={store}>
      <AppShell />
    </DemoProvider>,
  );
  return store;
}

function createRecordingEmployerStore(): {
  actions: DemoAction[];
  store: DemoStore;
} {
  const initial = createInitialDemoState();
  const baseStore = createDemoStore({ ...initial, mode: "employer" });
  const actions: DemoAction[] = [];
  return {
    actions,
    store: {
      dispatch(action) {
        actions.push(structuredClone(action));
        baseStore.dispatch(action);
      },
      getState: baseStore.getState,
      subscribe: baseStore.subscribe,
    },
  };
}

function renderEmployerStore(store: DemoStore) {
  render(
    <DemoProvider store={store}>
      <AppShell />
    </DemoProvider>,
  );
}

function openOpportunityBuilder() {
  fireEvent.click(screen.getByRole("tab", { name: /create opportunity/i }));
}

function previewDraft() {
  fireEvent.click(screen.getByRole("button", { name: /preview draft/i }));
}

afterEach(() => {
  setModelContext(undefined);
});

describe("EmployerExperience", () => {
  it("creates and validates an opportunity draft", () => {
    setModelContext(undefined);
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /employer hub/i }));
    expect(
      screen.getByRole("heading", { name: /workforce overview/i }),
    ).toBeInTheDocument();
    openOpportunityBuilder();
    fireEvent.change(screen.getByLabelText(/opportunity name/i), {
      target: { value: "October Reliability Reward" },
    });
    previewDraft();
    fireEvent.click(screen.getByRole("button", { name: /save draft/i }));
    fireEvent.click(
      screen.getByRole("button", { name: /validate programme/i }),
    );
    expect(screen.getByText(/review required/i)).toBeInTheDocument();
    expect(screen.getByText(/3 fairness exceptions/i)).toBeInTheDocument();
  });

  it("derives employer profile content from the employer dashboard DTO", () => {
    const initial = createInitialDemoState();
    const store = createDemoStore({
      ...initial,
      mode: "employer",
      employer: {
        ...initial.employer,
        profile: {
          ...initial.employer.profile,
          employerName: "Capability Retail Group",
          role: "People Operations Lead",
        },
      },
    });

    render(
      <DemoProvider store={store}>
        <AppShell />
      </DemoProvider>,
    );

    expect(
      screen.getByText("Capability Retail Group · People Operations Lead"),
    ).toBeInTheDocument();
  });

  it("shows all three anonymised data exceptions on the dashboard", () => {
    renderEmployer();

    expect(screen.getByText("N. Dlamini")).toBeInTheDocument();
    expect(screen.getByText("T. Mokoena")).toBeInTheDocument();
    expect(screen.getByText("L. Ndlovu")).toBeInTheDocument();
  });

  it("derives non-three exception count copy from the safe exception DTO", () => {
    const initial = createInitialDemoState();
    const store = createDemoStore({
      ...initial,
      mode: "employer",
      employer: {
        ...initial.employer,
        fairnessExceptions: initial.employer.fairnessExceptions.slice(0, 1),
      },
    });

    renderEmployerStore(store);

    expect(
      screen.getByText("1 anonymised record needs review."),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Three anonymised records need review."),
    ).not.toBeInTheDocument();
  });

  it("starts with every controlled draft property and exact domain defaults", () => {
    renderEmployer();
    openOpportunityBuilder();

    expect(screen.getByLabelText("Opportunity type")).toHaveValue("attendance");
    expect(screen.getByLabelText("Opportunity name")).toHaveValue(
      "October Reliability Reward",
    );
    expect(screen.getByLabelText("Outcome")).toHaveValue(
      "Improve reliable attendance",
    );
    expect(screen.getByLabelText("Eligible segment")).toHaveValue(
      "All active retail employees",
    );
    expect(screen.getByLabelText("Qualification rule")).toHaveValue(
      "Complete 5 published shifts without an unexcused absence",
    );
    expect(screen.getByLabelText("Start date")).toHaveValue("2026-10-01");
    expect(screen.getByLabelText("End date")).toHaveValue("2026-10-31");
    expect(screen.getByLabelText("Reward type")).toHaveValue("cash");
    expect(screen.getByLabelText("Reward amount")).toHaveValue(250);
    expect(screen.getByLabelText("Total budget")).toHaveValue(125000);
    expect(screen.getByLabelText("Maximum per employee")).toHaveValue(250);
    expect(screen.getByLabelText("Exception policy")).toHaveValue(
      "Approved leave and employer schedule changes enter manager review",
    );
    expect(screen.getByRole("button", { name: /save draft/i })).toBeDisabled();
    expect(
      screen.getByRole("button", { name: /validate programme/i }),
    ).toBeDisabled();
  });

  it("previews without mutation and invalidates a stale snapshot after edits", () => {
    const store = renderEmployer();
    openOpportunityBuilder();
    const stateBeforePreview = structuredClone(store.getState());

    previewDraft();

    const preview = screen.getByRole("region", { name: /draft preview/i });
    expect(
      within(preview).getByText("October Reliability Reward"),
    ).toBeInTheDocument();
    expect(within(preview).getByText(/R\s*125\s*000/)).toBeInTheDocument();
    expect(store.getState()).toEqual(stateBeforePreview);
    expect(screen.getByRole("button", { name: /save draft/i })).toBeEnabled();

    fireEvent.change(screen.getByLabelText("Opportunity name"), {
      target: { value: "Edited after preview" },
    });

    expect(
      screen.queryByRole("region", { name: /draft preview/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /save draft/i })).toBeDisabled();
    expect(store.getState().employer.activeDraft).toBeNull();
    expect(store.getState().activity).toBeNull();
  });

  it("saves the exact preview snapshot and records validation from the UI", () => {
    const { actions, store } = createRecordingEmployerStore();
    renderEmployerStore(store);
    openOpportunityBuilder();
    fireEvent.change(screen.getByLabelText("Opportunity type"), {
      target: { value: "learning" },
    });
    fireEvent.change(screen.getByLabelText("Opportunity name"), {
      target: { value: "November Learning Reward" },
    });
    fireEvent.change(screen.getByLabelText("Outcome"), {
      target: { value: "Complete priority learning" },
    });
    fireEvent.change(screen.getByLabelText("Eligible segment"), {
      target: { value: "Active Gauteng retail employees" },
    });
    fireEvent.change(screen.getByLabelText("Qualification rule"), {
      target: { value: "Complete the November safety pathway" },
    });
    fireEvent.change(screen.getByLabelText("Start date"), {
      target: { value: "2026-11-01" },
    });
    fireEvent.change(screen.getByLabelText("End date"), {
      target: { value: "2026-11-30" },
    });
    fireEvent.change(screen.getByLabelText("Reward type"), {
      target: { value: "voucher" },
    });
    fireEvent.change(screen.getByLabelText("Reward amount"), {
      target: { value: "300" },
    });
    fireEvent.change(screen.getByLabelText("Total budget"), {
      target: { value: "150000" },
    });
    fireEvent.change(screen.getByLabelText("Maximum per employee"), {
      target: { value: "350" },
    });
    fireEvent.change(screen.getByLabelText("Exception policy"), {
      target: { value: "Approved training outages enter manager review" },
    });
    const previewSnapshot = {
      type: "learning",
      name: "November Learning Reward",
      outcome: "Complete priority learning",
      eligibleSegment: "Active Gauteng retail employees",
      qualificationRule: "Complete the November safety pathway",
      startDate: "2026-11-01",
      endDate: "2026-11-30",
      rewardType: "voucher",
      rewardAmount: 300,
      totalBudget: 150000,
      maxPerEmployee: 350,
      exceptionPolicy: "Approved training outages enter manager review",
    } as const;
    actions.length = 0;
    const stateBeforePreview = structuredClone(store.getState());
    previewDraft();

    expect(store.getState()).toEqual(stateBeforePreview);
    expect(actions).toEqual([]);
    const preview = screen.getByRole("region", { name: /draft preview/i });
    for (const previewValue of [
      previewSnapshot.type,
      previewSnapshot.name,
      previewSnapshot.outcome,
      previewSnapshot.eligibleSegment,
      previewSnapshot.qualificationRule,
      previewSnapshot.exceptionPolicy,
    ]) {
      expect(within(preview).getByText(previewValue)).toBeInTheDocument();
    }
    expect(
      within(preview).getByText(
        `${previewSnapshot.startDate} to ${previewSnapshot.endDate}`,
      ),
    ).toBeInTheDocument();
    expect(within(preview).getByText(/R\s*300 voucher/i)).toBeInTheDocument();
    expect(within(preview).getByText(/R\s*150\s*000/)).toBeInTheDocument();
    expect(within(preview).getByText(/R\s*350/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /save draft/i }));

    const persistedDraft: OpportunityDraft = {
      id: "draft-opportunity",
      status: "draft",
      ...previewSnapshot,
    };
    expect(store.getState().employer.activeDraft).toEqual(persistedDraft);
    expect(actions).toEqual([
      {
        type: "employer/save-draft",
        draft: persistedDraft,
        source: "ui",
      },
    ]);
    expect(store.getState().activity).toEqual({
      id: 1,
      source: "ui",
      message: "Saved opportunity draft.",
    });
    expect(
      screen.getByRole("button", { name: /validate programme/i }),
    ).toBeEnabled();

    fireEvent.click(
      screen.getByRole("button", { name: /validate programme/i }),
    );

    expect(store.getState().activity).toMatchObject({
      source: "ui",
      message: "Validated opportunity draft.",
    });
    const validation = screen.getByRole("region", {
      name: /programme validation/i,
    });
    expect(within(validation).getByText("Review required")).toBeInTheDocument();
    expect(within(validation).getByText("Rules clear")).toBeInTheDocument();
    expect(within(validation).getByText("Data available")).toBeInTheDocument();
    expect(within(validation).getByText("Data fresh")).toBeInTheDocument();
    const fairness =
      within(validation).getByText("Fairness passed").parentElement;
    expect(fairness).not.toBeNull();
    expect(within(fairness!).getByText("No")).toBeInTheDocument();
    expect(within(validation).getByText("412")).toBeInTheDocument();
    expect(within(validation).getByText("68%")).toBeInTheDocument();
    expect(within(validation).getByText(/R\s*84\s*048/)).toBeInTheDocument();
    expect(within(validation).getByText(/R\s*144\s*200/)).toBeInTheDocument();
    expect(
      within(validation).getByText(/3 fairness exceptions/i),
    ).toBeInTheDocument();
  });

  it("presents a passing fairness result with direct yes semantics", () => {
    const validation: OpportunityValidation = {
      draftId: "draft-opportunity",
      readiness: "ready",
      rulesClear: true,
      dataAvailable: true,
      dataFresh: true,
      fairnessPassed: true,
      budgetWithinLimit: true,
      eligibleEmployeeCount: 412,
      expectedParticipationPercent: 68,
      estimatedCost: 70040,
      maximumExposure: 103000,
      unresolvedExceptionCount: 0,
      issues: [],
    };
    render(<OpportunityValidationCard validation={validation} />);

    const validationRegion = screen.getByRole("region", {
      name: /programme validation/i,
    });
    const fairness =
      within(validationRegion).getByText("Fairness passed").parentElement;
    expect(fairness).not.toBeNull();
    expect(within(fairness!).getByText("Yes")).toBeInTheDocument();
    expect(
      within(validationRegion).getByRole("heading", { name: "Ready" }),
    ).toBeInTheDocument();
    expect(
      within(validationRegion).getByText("0 unresolved"),
    ).toBeInTheDocument();
  });

  it("shows recovery for an insufficient budget without false readiness", () => {
    const store = renderEmployer();
    openOpportunityBuilder();
    fireEvent.change(screen.getByLabelText("Total budget"), {
      target: { value: "100000" },
    });
    previewDraft();
    fireEvent.click(screen.getByRole("button", { name: /save draft/i }));
    fireEvent.click(
      screen.getByRole("button", { name: /validate programme/i }),
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      /increase the budget to at least R103,000/i,
    );
    expect(
      screen.queryByRole("region", { name: /programme validation/i }),
    ).not.toBeInTheDocument();
    expect(store.getState().employer.validation).toBeNull();
    expect(store.getState().activity).toMatchObject({
      source: "ui",
      message: "Saved opportunity draft.",
    });
  });

  it("keeps all employer tabs in shared state and renders aggregate DTOs", () => {
    const store = renderEmployer();
    const destinations: readonly [EmployerTab, string, RegExp][] = [
      ["dashboard", "Dashboard", /programmes/i],
      ["opportunity", "Create Opportunity", /build an opportunity/i],
      ["shifts", "Manage Shifts", /open shifts/i],
      ["fairness", "Fairness & Data", /fairness and data/i],
    ];

    for (const [id, tabName, heading] of destinations) {
      fireEvent.click(screen.getByRole("tab", { name: tabName }));
      expect(store.getState().employer.activeTab).toBe(id);
      expect(screen.getByRole("tab", { name: tabName })).toHaveAttribute(
        "aria-selected",
        "true",
      );
      expect(
        screen.getByRole("heading", { name: heading }),
      ).toBeInTheDocument();
    }

    expect(screen.getByText("N. Dlamini")).toBeInTheDocument();
    expect(screen.getByText("T. Mokoena")).toBeInTheDocument();
    expect(screen.getByText("L. Ndlovu")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "Dashboard" }));
    expect(screen.getByText("847")).toBeInTheDocument();
    expect(screen.getByText("612")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "September Reliability Reward" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "Manage Shifts" }));
    expect(
      screen.getByText(/Sales Floor · Rosebank Mall/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/3 applications · 2 places/i)).toBeInTheDocument();
    expect(screen.getAllByText(/before deductions/i).length).toBeGreaterThan(0);
  });

  it("provides scoped non-shrinking employer tabs for narrow screens", () => {
    renderEmployer();

    const tablist = screen.getByRole("tablist", { name: "Employer Hub" });
    expect(tablist.closest(".employer-experience__tabs")).toBeInTheDocument();
    screen.getAllByRole("tab").forEach((tab) => {
      expect(tab).toHaveClass("tabs__tab");
    });

    const narrowMediaStart = featuresCss.indexOf("@media (max-width: 47.5rem)");
    const nextMediaStart = featuresCss.indexOf("@media", narrowMediaStart + 1);
    const narrowCss = featuresCss
      .slice(
        narrowMediaStart,
        nextMediaStart === -1 ? undefined : nextMediaStart,
      )
      .replace(/\s+/g, " ");

    expect(narrowCss).toMatch(
      /\.employer-experience__tabs \.tabs__list\s*\{[^}]*overflow-x:\s*auto;/,
    );
    expect(narrowCss).toMatch(
      /\.employer-experience__tabs \.tabs__tab\s*\{[^}]*flex:\s*0 0 auto;/,
    );
  });
});
