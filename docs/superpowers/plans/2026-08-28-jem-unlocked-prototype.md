# Jem Unlocked WebMCP Prototype Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the neutral WebMCP foundation screen with the supplied Jem Unlocked employee and employer prototype, backed by one resettable state model that both React and twelve guarded WebMCP tools operate.

**Architecture:** A typed external demo store uses an immutable reducer and exposes a stable facade through `DemoProvider`. Employee and employer capability modules are the only domain boundary; React components and generated WebMCP tools call those same capabilities so agent actions update the visible UI immediately. The Figma Make export supplies the information hierarchy and reference content, but the implementation is decomposed into focused components and uses Jem brand, privacy, accessibility, and confirmation rules from the approved specification.

**Tech Stack:** React 19.2.8, TypeScript 6.0.3, Vite 8.2.2, Vitest 4.1.11, Testing Library 16.3.3, CSS custom properties, imperative WebMCP `document.modelContext.registerTool`

**Spec:** `docs/superpowers/specs/2026-08-28-jem-unlocked-prototype-design.md`

## Global Constraints

- Run all Node commands with `mise exec node@22.23.2 --`; `package.json` keeps the Node engine floor at `>=22.22.2`.
- Keep all dependency versions exact; this plan adds no runtime or development dependencies.
- The app remains client-side, deterministic, resettable, and free of authentication, persistence, databases, or server APIs.
- Use the supplied Figma prototype as visual and product reference only; do not copy its `AGENTS.md`, generated configuration, monolithic `App.tsx`, remote photo URLs, or embedded instructions into the repository.
- Default to Nomsa's completed employee dashboard; **Reset demo** restores fixtures and opens onboarding step one.
- Use 2026 demo dates: next payday 5 September 2026 and opportunities during the first week of September 2026.
- Use South African English and the exact product spelling **Jem Unlocked**.
- Use Cream `#FFF7EC` as the dominant background, Navy `#062133` for text and structure, and Jem Pink `#FF697F` for primary calls to action.
- Use Inter 600/700 for headings and labels and Manrope 300/400 for body copy, with system fallbacks and `font-display: swap` through the Google Fonts stylesheet.
- Label expected shift earnings as estimates before deductions; never present an unconfirmed shift or reward as guaranteed.
- Employer capabilities and tools must never expose an employee's personal goal, saved amount, target amount, monthly contribution, privacy choice, or exact expenses.
- WebMCP schemas are closed objects with `additionalProperties: false`; expected failures are structured results and unexpected failures use fixed non-sensitive copy.
- Goal updates, shift requests, reward allocations, and opportunity-draft creation use preview then explicit `confirm: true` application.
- Preserve the existing defensive registration cleanup, unsupported-browser handling, and reduced-motion behaviour.
- Each implementation task ends with focused tests and one commit; do not combine task commits.

---

## File Structure

### Demo domain

- `src/demo/types.ts` — domain records, input/result contracts, store and action types.
- `src/demo/fixtures.ts` — immutable 2026 employee, employer, opportunity, and programme fixtures plus `createInitialDemoState()`.
- `src/demo/reducer.ts` — pure state transitions and reset logic.
- `src/demo/store.ts` — subscribable store with `getState`, `dispatch`, and `subscribe`.
- `src/demo/selectors.ts` — derived goal, affordability, dashboard, programme, and privacy-safe aggregate views.
- `src/demo/capability-result.ts` — shared `read`, `preview`, `applied`, and `failure` constructors.
- `src/demo/employee-capabilities.ts` — employee read and guarded mutation operations.
- `src/demo/employer-capabilities.ts` — employer aggregate, draft, validation, shift, and fairness operations.
- `src/demo/capabilities.ts` — stable `DemoCapabilities` facade assembled from one store.
- `src/demo/DemoProvider.tsx` — React context and `useSyncExternalStore` selector hooks.

### Shared application and UI

- `src/app/App.tsx` — provider composition only.
- `src/app/AppShell.tsx` — mode routing, WebMCP registration, activity announcement, and dialogs.
- `src/app/AppHeader.tsx` — Jem identity, mode control, persona, readiness, and reset.
- `src/components/Button.tsx` — button variants and pending/disabled treatment.
- `src/components/Card.tsx` — consistent surface wrapper.
- `src/components/Dialog.tsx` — labelled modal with focus placement, Escape, trap, and restoration.
- `src/components/ProgressRing.tsx` — accessible SVG progress visual.
- `src/components/StatusBadge.tsx` — text-labelled state badge.
- `src/components/Tabs.tsx` — keyboard-accessible tab list and panels.
- `src/components/format.ts` — South African currency, date, and percentage formatters.

### Feature components

- `src/onboarding/OnboardingFlow.tsx` — four-step onboarding.
- `src/employee/EmployeeExperience.tsx` — employee tab composition.
- `src/employee/EmployeeOverview.tsx` — goal and next-action dashboard.
- `src/employee/EmployeeShifts.tsx` — confirmed and available shifts.
- `src/employee/EmployeeLearning.tsx` — learning opportunities.
- `src/employee/EmployeeRewards.tsx` — reward progress and allocation dialog.
- `src/employee/GoalEditorDialog.tsx` — goal and expense editing.
- `src/employer/EmployerExperience.tsx` — employer tab composition.
- `src/employer/EmployerDashboard.tsx` — aggregate dashboard and programmes.
- `src/employer/OpportunityBuilder.tsx` — draft form, validation, and cost/reach result.
- `src/employer/EmployerShifts.tsx` — operational open-shift view.
- `src/employer/FairnessData.tsx` — confidence, exceptions, and fairness rules.

### WebMCP and styling

- `src/webmcp/tool-helpers.ts` — closed-schema input validation and safe execution wrapper.
- `src/webmcp/employee-tools.ts` — five employee tool factories.
- `src/webmcp/employer-tools.ts` — six employer tool factories.
- `src/webmcp/tools.ts` — status tool plus `createWebMcpTools(capabilities)` composition.
- `src/webmcp/use-webmcp-status.ts` — register a stable supplied tool array.
- `src/styles/tokens.css` — Jem colours, typography, spacing, radii, and shadows.
- `src/styles/base.css` — reset, global structure, focus, and reduced-motion rules.
- `src/styles/components.css` — shared component styles.
- `src/styles/features.css` — employee, employer, onboarding, and responsive layouts.

---

### Task 1: Create the typed demo state and store

**Files:**

- Create: `src/demo/types.ts`
- Create: `src/demo/fixtures.ts`
- Create: `src/demo/reducer.ts`
- Create: `src/demo/store.ts`
- Create: `src/demo/selectors.ts`
- Test: `src/demo/store.test.ts`
- Test: `src/demo/selectors.test.ts`

**Interfaces:**

- Consumes: no new feature interfaces; keep existing app code compiling.
- Produces: `DemoState`, `DemoAction`, `DemoStore`, `createInitialDemoState()`, `demoReducer()`, `createDemoStore()`, `selectGoalProgress()`, `selectAffordability()`, `selectEmployeeDashboard()`, and `selectEmployerDashboard()`.

- [ ] **Step 1: Write failing fixture, reducer, store, and selector tests**

```ts
// src/demo/store.test.ts
import { describe, expect, it, vi } from "vitest";
import { createInitialDemoState } from "./fixtures";
import { createDemoStore } from "./store";

describe("createDemoStore", () => {
  it("starts on the completed employee dashboard and can reset to onboarding", () => {
    const store = createDemoStore();
    expect(store.getState()).toMatchObject({
      mode: "employee",
      onboarding: { completed: true, step: 1 },
      employee: { activeTab: "overview" },
    });

    store.dispatch({ type: "demo/reset" });
    expect(store.getState()).toMatchObject({
      mode: "employee",
      onboarding: { completed: false, step: 1 },
    });
  });

  it("publishes immutable reducer transitions to subscribers", () => {
    const store = createDemoStore();
    const initial = store.getState();
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);

    store.dispatch({ type: "navigation/set-mode", mode: "employer" });

    expect(store.getState()).not.toBe(initial);
    expect(store.getState().mode).toBe("employer");
    expect(listener).toHaveBeenCalledOnce();
    unsubscribe();
  });

  it("creates independent fixture graphs", () => {
    expect(createInitialDemoState()).not.toBe(createInitialDemoState());
    expect(createInitialDemoState().employee.goal).not.toBe(
      createInitialDemoState().employee.goal,
    );
  });
});
```

```ts
// src/demo/selectors.test.ts
import { describe, expect, it } from "vitest";
import { createInitialDemoState } from "./fixtures";
import {
  selectAffordability,
  selectEmployeeDashboard,
  selectEmployerDashboard,
  selectGoalProgress,
} from "./selectors";

describe("demo selectors", () => {
  const state = createInitialDemoState();

  it("derives Nomsa's goal and affordability without mutating state", () => {
    expect(selectGoalProgress(state)).toEqual({
      saved: 2520,
      target: 6000,
      remaining: 3480,
      percentage: 42,
      monthsRemaining: 9,
    });
    expect(selectAffordability(state)).toMatchObject({
      expectedEarnings: 4800,
      totalExpenses: 3600,
      availableAfterExpenses: 1200,
      suggestedMonthlyContribution: 400,
    });
  });

  it("keeps employee financial fields out of the employer dashboard", () => {
    const dashboard = selectEmployerDashboard(state);
    expect(dashboard).toMatchObject({ employerName: "Pick n Pay Retail" });
    expect(JSON.stringify(dashboard)).not.toContain("2520");
    expect(JSON.stringify(dashboard)).not.toContain("3600");
    expect(selectEmployeeDashboard(state).goal.name).toBe("School Fees");
  });
});
```

- [ ] **Step 2: Run the focused tests and verify that imports fail**

Run: `mise exec node@22.23.2 -- npm test -- src/demo/store.test.ts src/demo/selectors.test.ts`

Expected: FAIL because the demo modules do not exist.

- [ ] **Step 3: Implement domain types, 2026 fixtures, pure reducer, store, and selectors**

Define the stable contracts in `types.ts`:

```ts
export type AppMode = "employee" | "employer";
export type EmployeeTab = "overview" | "shifts" | "learn" | "rewards";
export type EmployerTab = "dashboard" | "opportunity" | "shifts" | "fairness";
export type OpportunityCategory = "all" | "shift" | "learning" | "reward";

export interface Goal {
  name: string;
  emoji: string;
  targetAmount: number;
  savedAmount: number;
  targetDate: string;
  monthlyContribution: number;
  isPrivate: boolean;
}

export interface DemoStore {
  getState(): DemoState;
  dispatch(action: DemoAction): void;
  subscribe(listener: () => void): () => void;
}

export type DemoAction =
  | { type: "demo/reset" }
  | { type: "navigation/set-mode"; mode: AppMode }
  | { type: "navigation/set-employee-tab"; tab: EmployeeTab }
  | { type: "navigation/set-employer-tab"; tab: EmployerTab }
  | { type: "onboarding/set-step"; step: 1 | 2 | 3 | 4 }
  | { type: "onboarding/complete" }
  | { type: "employee/replace-goal"; goal: Goal; source: "ui" | "webmcp" }
  | {
      type: "employee/replace-expenses";
      expenses: ExpenseMap;
      source: "ui" | "webmcp";
    }
  | { type: "employee/request-shift"; shiftId: string; source: "ui" | "webmcp" }
  | {
      type: "employee/allocate-reward";
      rewardId: string;
      destination: "savings" | "voucher";
      source: "ui" | "webmcp";
    }
  | {
      type: "employer/save-draft";
      draft: OpportunityDraft;
      source: "ui" | "webmcp";
    }
  | {
      type: "employer/set-validation";
      validation: OpportunityValidation;
      source: "ui" | "webmcp";
    }
  | { type: "activity/dismiss" };
```

`createInitialDemoState()` must build fresh arrays and nested records for Nomsa, Sipho, the three open shifts, three learning records, three rewards, three programmes, and three anonymised fairness exceptions. Implement the store without mutation:

```ts
export function createDemoStore(
  initialState: DemoState = createInitialDemoState(),
): DemoStore {
  let state = initialState;
  const listeners = new Set<() => void>();
  return {
    getState: () => state,
    dispatch(action) {
      const next = demoReducer(state, action);
      if (next !== state) {
        state = next;
        listeners.forEach((listener) => listener());
      }
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
```

- [ ] **Step 4: Run focused tests and the existing suite**

Run: `mise exec node@22.23.2 -- npm test -- src/demo/store.test.ts src/demo/selectors.test.ts`

Expected: PASS.

Run: `mise exec node@22.23.2 -- npm test`

Expected: existing foundation tests and new demo tests PASS.

- [ ] **Step 5: Commit the domain foundation**

```bash
git add src/demo
git commit -m "feat: model the Jem Unlocked demo state"
```

---

### Task 2: Add employee capabilities with preview and confirmation

**Files:**

- Create: `src/demo/capability-result.ts`
- Create: `src/demo/employee-capabilities.ts`
- Test: `src/demo/employee-capabilities.test.ts`

**Interfaces:**

- Consumes: `DemoStore`, `Goal`, `OpportunityCategory`, and demo selectors from Task 1.
- Produces: `CapabilityResult<T>`, `CapabilityErrorCode`, `UpdateSavingsGoalInput`, `RequestShiftInput`, `AllocateRewardInput`, `EmployeeCapabilities`, and `createEmployeeCapabilities(store)`.

- [ ] **Step 1: Write failing tests for reads, privacy, preview, application, and invalid transitions**

```ts
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
```

- [ ] **Step 2: Run the employee capability test and verify failure**

Run: `mise exec node@22.23.2 -- npm test -- src/demo/employee-capabilities.test.ts`

Expected: FAIL because `createEmployeeCapabilities` does not exist.

- [ ] **Step 3: Implement result constructors and the exact employee capability surface**

```ts
export type CapabilityErrorCode =
  | "INVALID_INPUT"
  | "NOT_FOUND"
  | "CONFIRMATION_REQUIRED"
  | "ALREADY_REQUESTED"
  | "REWARD_NOT_EARNED"
  | "REWARD_ALREADY_ALLOCATED"
  | "INCOMPLETE_DRAFT"
  | "BUDGET_EXCEEDED"
  | "STALE_STATE"
  | "UNSUPPORTED_WEBMCP";

export type CapabilityResult<T> =
  | {
      ok: true;
      status: "read" | "preview" | "applied";
      summary: string;
      data: T;
    }
  | {
      ok: false;
      status: "error";
      error: { code: CapabilityErrorCode; message: string; recovery: string };
    };

export interface EmployeeCapabilities {
  getDashboard(): CapabilityResult<EmployeeDashboard>;
  updateSavingsGoal(
    input: UpdateSavingsGoalInput,
    source?: ActionSource,
  ): CapabilityResult<GoalChange>;
  updateExpenses(
    input: UpdateExpensesInput,
    source?: ActionSource,
  ): CapabilityResult<AffordabilitySummary>;
  listOpportunities(input?: {
    category?: OpportunityCategory;
  }): CapabilityResult<EmployeeOpportunity[]>;
  requestShift(
    input: RequestShiftInput,
    source?: ActionSource,
  ): CapabilityResult<ShiftRequestResult>;
  allocateReward(
    input: AllocateRewardInput,
    source?: ActionSource,
  ): CapabilityResult<RewardAllocationResult>;
}
```

Define `type ActionSource = "ui" | "webmcp"`; mutation methods default it to `"webmcp"`. Validate finite non-negative money values, a target greater than zero, saved amount no greater than target, non-empty names, ISO target dates after the 2026-08-28 demo date, existing IDs, and reward state. Every tool-exposed mutation with `confirm: false` returns a preview without dispatch. `updateExpenses` is UI-only and validates all seven non-negative values before dispatch. `listOpportunities` returns benefit, estimate/confirmation status, effort, eligibility, expiry, and state for every record.

- [ ] **Step 4: Run employee capability tests and all demo tests**

Run: `mise exec node@22.23.2 -- npm test -- src/demo/employee-capabilities.test.ts src/demo/store.test.ts src/demo/selectors.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit employee capabilities**

```bash
git add src/demo/capability-result.ts src/demo/employee-capabilities.ts src/demo/employee-capabilities.test.ts
git commit -m "feat: add guarded employee capabilities"
```

---

### Task 3: Add employer capabilities and privacy enforcement

**Files:**

- Create: `src/demo/employer-capabilities.ts`
- Create: `src/demo/capabilities.ts`
- Test: `src/demo/employer-capabilities.test.ts`
- Test: `src/demo/privacy.test.ts`

**Interfaces:**

- Consumes: `DemoStore`, result constructors, programme selectors, and employee capabilities from Tasks 1-2.
- Produces: `EmployerCapabilities`, `CreateOpportunityDraftInput`, `ProgrammeFilter`, `FairnessFilter`, `DemoCapabilities`, and `createDemoCapabilities(store)`.

- [ ] **Step 1: Write failing tests for employer reads, draft confirmation, validation, budget checks, and privacy**

```ts
import { describe, expect, it } from "vitest";
import { createEmployerCapabilities } from "./employer-capabilities";
import { createDemoStore } from "./store";

const validDraft = {
  name: "October Reliability Reward",
  type: "attendance" as const,
  outcome: "Reward on-time attendance during October",
  eligibleSegment: "Rosebank retail employees",
  qualificationRule: "Arrive on time for every confirmed October shift",
  startDate: "2026-10-01",
  endDate: "2026-10-31",
  rewardType: "cash" as const,
  rewardAmount: 250,
  totalBudget: 105000,
  maxPerEmployee: 250,
  exceptionPolicy: "Approved leave and employer roster changes enter review",
};

describe("employer capabilities", () => {
  it("previews and saves a draft without launching it", () => {
    const store = createDemoStore();
    const capabilities = createEmployerCapabilities(store);
    expect(
      capabilities.createOpportunityDraft({ ...validDraft, confirm: false }),
    ).toMatchObject({ ok: true, status: "preview" });
    expect(store.getState().employer.activeDraft).toBeNull();
    expect(
      capabilities.createOpportunityDraft({ ...validDraft, confirm: true }),
    ).toMatchObject({ ok: true, status: "applied" });
    expect(store.getState().employer.activeDraft?.status).toBe("draft");
  });

  it("validates fairness and blocks a budget below maximum exposure", () => {
    const store = createDemoStore();
    const capabilities = createEmployerCapabilities(store);
    capabilities.createOpportunityDraft({
      ...validDraft,
      totalBudget: 50000,
      confirm: true,
    });
    expect(
      capabilities.validateOpportunity({ draftId: "draft-opportunity" }),
    ).toMatchObject({
      ok: false,
      error: { code: "BUDGET_EXCEEDED" },
    });
  });
});
```

```ts
// src/demo/privacy.test.ts
import { describe, expect, it } from "vitest";
import { createDemoCapabilities } from "./capabilities";
import { createDemoStore } from "./store";

describe("employer privacy boundary", () => {
  it("never serialises protected employee financial fields", () => {
    const employer = createDemoCapabilities(createDemoStore()).employer;
    const payloads = [
      employer.getDashboard(),
      employer.listProgrammes(),
      employer.listOpenShifts(),
      employer.listFairnessExceptions(),
    ];
    const serialised = JSON.stringify(payloads);
    for (const protectedValue of [
      "School Fees",
      "2520",
      "6000",
      "dependants",
      "monthlyContribution",
      "isPrivate",
    ]) {
      expect(serialised).not.toContain(protectedValue);
    }
  });
});
```

- [ ] **Step 2: Run focused tests and verify failure**

Run: `mise exec node@22.23.2 -- npm test -- src/demo/employer-capabilities.test.ts src/demo/privacy.test.ts`

Expected: FAIL because employer and combined capability factories do not exist.

- [ ] **Step 3: Implement employer capabilities and the combined facade**

```ts
export interface EmployerCapabilities {
  getDashboard(): CapabilityResult<EmployerDashboard>;
  listProgrammes(input?: {
    status?: ProgrammeStatus | "all";
  }): CapabilityResult<ProgrammeSummary[]>;
  createOpportunityDraft(
    input: CreateOpportunityDraftInput,
    source?: ActionSource,
  ): CapabilityResult<OpportunityDraft>;
  validateOpportunity(
    input: { draftId: string },
    source?: ActionSource,
  ): CapabilityResult<OpportunityValidation>;
  listOpenShifts(): CapabilityResult<EmployerShiftSummary[]>;
  listFairnessExceptions(input?: {
    severity?: FairnessSeverity | "all";
  }): CapabilityResult<FairnessExceptionSummary[]>;
}

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
```

Draft validation checks every required string, ISO date order, positive reward and budget values, reward amount at or below per-employee maximum, and maximum exposure of `eligibleEmployeeCount * maxPerEmployee` at or below total budget. Successful validation returns readiness `review_required` because three fixture exceptions remain unresolved; it cannot launch or approve a programme.

- [ ] **Step 4: Run employer, privacy, and full demo tests**

Run: `mise exec node@22.23.2 -- npm test -- src/demo`

Expected: PASS.

- [ ] **Step 5: Commit employer capabilities**

```bash
git add src/demo
git commit -m "feat: add privacy-safe employer capabilities"
```

---

### Task 4: Build the provider, branded app shell, and shared components

**Files:**

- Create: `src/demo/DemoProvider.tsx`
- Create: `src/app/AppShell.tsx`
- Create: `src/app/AppHeader.tsx`
- Create: `src/components/Button.tsx`
- Create: `src/components/Card.tsx`
- Create: `src/components/Dialog.tsx`
- Create: `src/components/ProgressRing.tsx`
- Create: `src/components/StatusBadge.tsx`
- Create: `src/components/Tabs.tsx`
- Create: `src/components/format.ts`
- Create: `src/styles/tokens.css`
- Create: `src/styles/base.css`
- Create: `src/styles/components.css`
- Create: `src/styles/features.css`
- Modify: `src/app/App.tsx`
- Modify: `src/app/app-status.ts`
- Modify: `src/app/app-status.test.ts`
- Modify: `src/main.tsx`
- Delete: `src/styles.css`
- Test: `src/demo/DemoProvider.test.tsx`
- Test: `src/components/Dialog.test.tsx`
- Test: `src/app/App.test.tsx`

**Interfaces:**

- Consumes: `createDemoStore()`, `createDemoCapabilities()`, `WebMcpStatus`, and the existing readiness hook.
- Produces: `DemoProvider`, `useDemoStore()`, `useDemoCapabilities()`, `useDemoSelector(selector)`, `AppShell`, and reusable component props.

- [ ] **Step 1: Replace shell tests with failing provider, reset, brand, and dialog tests**

```tsx
// src/app/App.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "./App";

describe("App", () => {
  it("opens on a branded Nomsa summary with reset available", () => {
    render(<App />);
    expect(
      screen.getByRole("heading", { name: /hey nomsa/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Jem Unlocked")).toBeInTheDocument();
    expect(screen.getByText(/school fees/i)).toBeInTheDocument();
    expect(screen.getByText(/42%/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /reset demo/i })).toBeEnabled();
  });
});
```

```tsx
// src/components/Dialog.test.tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { Dialog } from "./Dialog";

it("labels, closes, and restores focus", () => {
  const onClose = vi.fn();
  function Harness() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <button onClick={() => setOpen(true)}>Open editor</button>
        <Dialog
          open={open}
          title="Edit goal"
          onClose={() => {
            onClose();
            setOpen(false);
          }}
        >
          <button>Save</button>
        </Dialog>
      </>
    );
  }
  render(<Harness />);
  const trigger = screen.getByRole("button", { name: "Open editor" });
  fireEvent.click(trigger);
  expect(screen.getByRole("dialog", { name: "Edit goal" })).toBeInTheDocument();
  fireEvent.keyDown(document, { key: "Escape" });
  expect(onClose).toHaveBeenCalledOnce();
  expect(trigger).toHaveFocus();
});
```

- [ ] **Step 2: Run the component and app tests and verify failure**

Run: `mise exec node@22.23.2 -- npm test -- src/demo/DemoProvider.test.tsx src/components/Dialog.test.tsx src/app/App.test.tsx`

Expected: FAIL because the provider, components, and new shell do not exist.

- [ ] **Step 3: Implement stable provider hooks and shared components**

```tsx
const StoreContext = createContext<DemoStore | null>(null);
const CapabilitiesContext = createContext<DemoCapabilities | null>(null);

export function DemoProvider({ children }: PropsWithChildren) {
  const storeRef = useRef<DemoStore | null>(null);
  if (storeRef.current === null) storeRef.current = createDemoStore();
  const capabilities = useMemo(
    () => createDemoCapabilities(storeRef.current!),
    [],
  );
  return (
    <StoreContext.Provider value={storeRef.current}>
      <CapabilitiesContext.Provider value={capabilities}>
        {children}
      </CapabilitiesContext.Provider>
    </StoreContext.Provider>
  );
}

export function useDemoSelector<T>(selector: (state: DemoState) => T): T {
  const store = useDemoStore();
  return useSyncExternalStore(store.subscribe, () =>
    selector(store.getState()),
  );
}
```

`Dialog` records `document.activeElement`, focuses its close button on open, traps Tab within its focusable children, closes on Escape and backdrop click, and restores the recorded focus after close. `Tabs` uses `role="tablist"`, roving `tabIndex`, ArrowLeft/ArrowRight/Home/End, `aria-selected`, and linked tabpanel IDs. `ProgressRing` receives a visible label and renders an SVG with `role="img"` and `<title>`.

- [ ] **Step 4: Implement the branded shell and CSS layers**

`App` becomes:

```tsx
export function App() {
  return (
    <DemoProvider>
      <AppShell />
    </DemoProvider>
  );
}
```

For this independently testable shell task, `AppShell` renders `AppHeader` plus a compact real summary derived from `selectEmployeeDashboard`: `Hey Nomsa`, `School Fees`, and the 42% progress text. Task 6 expands that summary into the complete employee experience. Keep the Task 4 app test focused on the header, summary, readiness state, and reset dispatch; the reset-to-onboarding assertion belongs to Task 5.

Change `getAppStatus()` to `{ name: "Jem Unlocked", phase: "prototype", webMcpReady: true }`. Import fonts and styles from `src/main.tsx`:

```ts
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/components.css";
import "./styles/features.css";
```

Begin `tokens.css` with the exact Inter/Manrope stylesheet and define the CSS Jem mark as a pink rounded pill containing lowercase `jem` in white:

```css
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@500;600;700&family=Manrope:wght@300;400;500;600&display=swap");

:root {
  --jem-cream: #fff7ec;
  --jem-navy: #062133;
  --jem-pink: #ff697f;
  --font-heading: "Inter", system-ui, sans-serif;
  --font-body: "Manrope", "Inter", system-ui, sans-serif;
}
```

- [ ] **Step 5: Run tests and static checks**

Run: `mise exec node@22.23.2 -- npm test -- src/demo/DemoProvider.test.tsx src/components/Dialog.test.tsx src/app/App.test.tsx src/app/app-status.test.ts`

Expected: PASS.

Run: `mise exec node@22.23.2 -- npm run lint`

Expected: PASS.

- [ ] **Step 6: Commit the app shell and shared UI**

```bash
git add src/app src/components src/demo/DemoProvider.tsx src/main.tsx src/styles src/styles.css
git commit -m "feat: add the Jem Unlocked application shell"
```

---

### Task 5: Implement onboarding and employee editing

**Files:**

- Create: `src/onboarding/OnboardingFlow.tsx`
- Create: `src/employee/GoalEditorDialog.tsx`
- Modify: `src/app/AppShell.tsx`
- Modify: `src/styles/features.css`
- Test: `src/onboarding/OnboardingFlow.test.tsx`
- Test: `src/employee/GoalEditorDialog.test.tsx`

**Interfaces:**

- Consumes: `DemoStore`, `useDemoSelector`, shared form/button/dialog components, selectors, and `employee.updateSavingsGoal()`.
- Produces: controlled four-step onboarding and an employee-only goal/expense editor.

- [ ] **Step 1: Write failing onboarding and editor interaction tests**

```tsx
it("moves through confirmation, goal, expenses, and plan steps", () => {
  render(<App />);
  fireEvent.click(screen.getByRole("button", { name: /reset demo/i }));
  fireEvent.click(screen.getByRole("button", { name: /details are correct/i }));
  fireEvent.click(screen.getByRole("button", { name: /continue/i }));
  expect(
    screen.getByRole("heading", { name: /set your goal/i }),
  ).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /school fees/i }));
  fireEvent.change(screen.getByLabelText(/target amount/i), {
    target: { value: "6000" },
  });
  fireEvent.click(screen.getByRole("button", { name: /continue/i }));
  expect(
    screen.getByRole("heading", { name: /monthly expenses/i }),
  ).toBeInTheDocument();
});
```

```tsx
it("applies an edited goal through the employee capability", () => {
  render(
    <DemoProvider>
      <GoalEditorDialog open onClose={() => undefined} />
    </DemoProvider>,
  );
  fireEvent.change(screen.getByLabelText(/goal name/i), {
    target: { value: "December Fund" },
  });
  fireEvent.click(screen.getByRole("button", { name: /save changes/i }));
  expect(screen.getByDisplayValue("December Fund")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run focused tests and verify failure**

Run: `mise exec node@22.23.2 -- npm test -- src/onboarding/OnboardingFlow.test.tsx src/employee/GoalEditorDialog.test.tsx`

Expected: FAIL because onboarding and editor components do not exist.

- [ ] **Step 3: Implement the four steps with private local drafts**

`OnboardingFlow` renders only when `state.onboarding.completed` is false. Keep input drafts local until the final action. Steps are:

1. Employment confirmation with employer, role, start date, hourly rate, pay frequency, payday, and a safe `Raise an HR query` message.
2. Goal selection and labelled fields for target, saved amount, date, monthly contribution, and privacy.
3. Seven labelled expense inputs and a private-data explanation.
4. Calculation summary, estimated completion, and **Open my dashboard**.

The final action calls `employee.updateSavingsGoal({ ...goalDraft, confirm: true }, "ui")`, calls `employee.updateExpenses(expenseDraft, "ui")`, and dispatches only the navigation action `onboarding/complete` directly.

```tsx
export function OnboardingFlow() {
  const state = useDemoSelector((value) => value);
  const capabilities = useDemoCapabilities();
  const store = useDemoStore();
  const [goalDraft, setGoalDraft] = useState(toGoalInput(state.employee.goal));
  const [expenseDraft, setExpenseDraft] = useState(state.employee.expenses);
  return (
    <main aria-labelledby="onboarding-title">
      <p>Step {state.onboarding.step} of 4</p>
      {renderOnboardingStep({
        state,
        goalDraft,
        setGoalDraft,
        expenseDraft,
        setExpenseDraft,
      })}
      {state.onboarding.step === 4 && (
        <Button
          onClick={() =>
            completeOnboarding({ capabilities, store, goalDraft, expenseDraft })
          }
        >
          Open my dashboard
        </Button>
      )}
    </main>
  );
}
```

Define the file-local helpers with these exact signatures: `toGoalInput(goal: Goal): Omit<UpdateSavingsGoalInput, "confirm">`, `renderOnboardingStep(args: OnboardingStepArgs): ReactNode`, and `completeOnboarding(args: CompleteOnboardingArgs): void`. `renderOnboardingStep` switches exhaustively over steps 1-4; `completeOnboarding` runs both capability calls, displays the returned recovery message if either fails, and dispatches `onboarding/complete` only after both succeed.

- [ ] **Step 4: Implement `GoalEditorDialog` with goal and expense tabs**

Use `Tabs` and `Dialog`; goal save calls `employee.updateSavingsGoal({ ...draft, confirm: true }, "ui")`, while expense save calls `employee.updateExpenses(expenseDraft, "ui")`. Assert in the existing capability tests that omitted provenance remains `webmcp`.

```tsx
export interface GoalEditorDialogProps {
  open: boolean;
  onClose(): void;
}

export function GoalEditorDialog({ open, onClose }: GoalEditorDialogProps) {
  const capabilities = useDemoCapabilities();
  const goal = useDemoSelector((state) => state.employee.goal);
  const expenses = useDemoSelector((state) => state.employee.expenses);
  return (
    <Dialog open={open} title="Edit my details" onClose={onClose}>
      <Tabs
        ariaLabel="Employee financial details"
        tabs={editorTabs(goal, expenses, capabilities, onClose)}
      />
    </Dialog>
  );
}
```

Define `editorTabs(goal: Goal, expenses: ExpenseMap, capabilities: DemoCapabilities, onClose: () => void): TabDefinition[]` in the same file. Its two panels contain the fully labelled goal and expense forms and invoke the exact capability calls above.

- [ ] **Step 5: Run focused tests and full suite**

Run: `mise exec node@22.23.2 -- npm test -- src/onboarding src/employee/GoalEditorDialog.test.tsx src/demo/employee-capabilities.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit onboarding and editing**

```bash
git add src/onboarding src/employee/GoalEditorDialog.tsx src/employee/GoalEditorDialog.test.tsx src/app/AppShell.tsx src/demo src/styles/features.css
git commit -m "feat: add employee onboarding and goal editing"
```

---

### Task 6: Implement the employee dashboard experience

**Files:**

- Create: `src/employee/EmployeeExperience.tsx`
- Create: `src/employee/EmployeeOverview.tsx`
- Create: `src/employee/EmployeeShifts.tsx`
- Create: `src/employee/EmployeeLearning.tsx`
- Create: `src/employee/EmployeeRewards.tsx`
- Modify: `src/app/AppShell.tsx`
- Modify: `src/styles/features.css`
- Test: `src/employee/EmployeeExperience.test.tsx`

**Interfaces:**

- Consumes: employee selectors and capabilities, `Tabs`, `Card`, `ProgressRing`, `StatusBadge`, `Button`, and `GoalEditorDialog`.
- Produces: complete overview/shifts/learn/rewards employee UI and visible updates from shared state.

- [ ] **Step 1: Write failing tests for default content, tab navigation, shift request, and reward allocation**

```tsx
describe("EmployeeExperience", () => {
  it("shows Nomsa's goal and clearly labels estimates", () => {
    render(<App />);
    expect(
      screen.getByRole("heading", { name: /hey nomsa/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "School Fees" }),
    ).toBeInTheDocument();
    expect(screen.getByText("42% complete")).toBeInTheDocument();
    expect(
      screen.getByText(/R480 estimated before deductions/i),
    ).toBeInTheDocument();
  });

  it("requests a shift and allocates an earned reward to savings", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("tab", { name: "Shifts" }));
    fireEvent.click(
      screen.getByRole("button", { name: /request saturday rosebank shift/i }),
    );
    fireEvent.click(screen.getByRole("button", { name: /^confirm request$/i }));
    expect(screen.getByText("Requested")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "Rewards" }));
    fireEvent.click(
      screen.getByRole("button", { name: /allocate august safety award/i }),
    );
    fireEvent.click(screen.getByLabelText(/add to jem savings/i));
    fireEvent.click(
      screen.getByRole("button", { name: /confirm allocation/i }),
    );
    expect(screen.getByText(/R150 added to Jem Savings/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the employee experience test and verify failure**

Run: `mise exec node@22.23.2 -- npm test -- src/employee/EmployeeExperience.test.tsx`

Expected: FAIL because the employee experience does not exist.

- [ ] **Step 3: Implement overview and tab composition**

The overview renders goal progress, payday, expected earnings, confirmed shifts, best next action, learning summary, reward progress, and recent activity. The next-action card must contain benefit, effort, eligibility, estimate status, and expiry. Clicking **View shift** selects the Shifts tab through the store.

```tsx
export function EmployeeExperience() {
  const activeTab = useDemoSelector((state) => state.employee.activeTab);
  const store = useDemoStore();
  const employeeTabs: TabDefinition[] = [
    { id: "overview", label: "Overview", panel: <EmployeeOverview /> },
    { id: "shifts", label: "Shifts", panel: <EmployeeShifts /> },
    { id: "learn", label: "Learn", panel: <EmployeeLearning /> },
    { id: "rewards", label: "Rewards", panel: <EmployeeRewards /> },
  ];
  return (
    <main className="experience" aria-labelledby="employee-title">
      <header>
        <p>Pick n Pay Retail · Senior Sales Associate</p>
        <h1 id="employee-title">Hey Nomsa 👋</h1>
      </header>
      <Tabs
        ariaLabel="Employee dashboard"
        selectedId={activeTab}
        onSelect={(tab) =>
          store.dispatch({
            type: "navigation/set-employee-tab",
            tab: tab as EmployeeTab,
          })
        }
        tabs={employeeTabs}
      />
    </main>
  );
}
```

- [ ] **Step 4: Implement shifts, learning, rewards, and confirmation dialogs**

Shift and reward UI mutations call the same capability preview first, display the returned summary in `Dialog`, and call again with `confirm: true` only after the confirmation button. Learning actions remain deterministic display-only because no learning mutation tool is in scope.

```tsx
const preview = capabilities.employee.requestShift(
  { shiftId, confirm: false },
  "ui",
);
if (preview.ok)
  setConfirmation({ kind: "shift", shiftId, summary: preview.summary });

function confirmShift() {
  capabilities.employee.requestShift(
    { shiftId: confirmation.shiftId, confirm: true },
    "ui",
  );
  setConfirmation(null);
}
```

- [ ] **Step 5: Run employee, capability, and app tests**

Run: `mise exec node@22.23.2 -- npm test -- src/employee src/demo/employee-capabilities.test.ts src/app/App.test.tsx`

Expected: PASS.

- [ ] **Step 6: Commit the employee experience**

```bash
git add src/employee src/app/AppShell.tsx src/styles/features.css
git commit -m "feat: build the employee goal dashboard"
```

---

### Task 7: Implement the employer hub experience

**Files:**

- Create: `src/employer/EmployerExperience.tsx`
- Create: `src/employer/EmployerDashboard.tsx`
- Create: `src/employer/OpportunityBuilder.tsx`
- Create: `src/employer/EmployerShifts.tsx`
- Create: `src/employer/FairnessData.tsx`
- Modify: `src/app/AppShell.tsx`
- Modify: `src/styles/features.css`
- Test: `src/employer/EmployerExperience.test.tsx`
- Test: `src/demo/privacy-ui.test.tsx`

**Interfaces:**

- Consumes: employer selectors and capabilities plus shared tabs, cards, fields, status badges, and formatters.
- Produces: complete employer dashboard/opportunity/shifts/fairness UI with no protected employee data.

- [ ] **Step 1: Write failing employer workflow and privacy tests**

```tsx
it("creates and validates an opportunity draft", () => {
  render(<App />);
  fireEvent.click(screen.getByRole("button", { name: /employer hub/i }));
  expect(
    screen.getByRole("heading", { name: /workforce overview/i }),
  ).toBeInTheDocument();
  fireEvent.click(screen.getByRole("tab", { name: /create opportunity/i }));
  fireEvent.change(screen.getByLabelText(/opportunity name/i), {
    target: { value: "October Reliability Reward" },
  });
  fireEvent.click(screen.getByRole("button", { name: /preview draft/i }));
  fireEvent.click(screen.getByRole("button", { name: /save draft/i }));
  fireEvent.click(screen.getByRole("button", { name: /validate programme/i }));
  expect(screen.getByText(/review required/i)).toBeInTheDocument();
  expect(screen.getByText(/3 fairness exceptions/i)).toBeInTheDocument();
});
```

```tsx
it("does not reveal Nomsa's protected financial values in employer mode", () => {
  render(<App />);
  fireEvent.click(screen.getByRole("button", { name: /employer hub/i }));
  expect(screen.queryByText("School Fees")).not.toBeInTheDocument();
  expect(screen.queryByText("R2,520")).not.toBeInTheDocument();
  expect(screen.queryByText("R6,000")).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run employer tests and verify failure**

Run: `mise exec node@22.23.2 -- npm test -- src/employer/EmployerExperience.test.tsx src/demo/privacy-ui.test.tsx`

Expected: FAIL because employer components do not exist.

- [ ] **Step 3: Implement dashboard, programmes, shifts, and fairness views**

The dashboard shows 847 total employees, 612 active employees, active programme count, aggregate goal engagement, budget usage, and three anonymised data exceptions. Programme rows show status, readiness, enrolment, participation, budget, and expiry. Fairness records use anonymised labels such as `N. Dlamini`; no personal financial data enters props.

```tsx
export function EmployerExperience() {
  const activeTab = useDemoSelector((state) => state.employer.activeTab);
  const store = useDemoStore();
  const employerTabs: TabDefinition[] = [
    { id: "dashboard", label: "Dashboard", panel: <EmployerDashboard /> },
    {
      id: "opportunity",
      label: "Create Opportunity",
      panel: <OpportunityBuilder />,
    },
    { id: "shifts", label: "Manage Shifts", panel: <EmployerShifts /> },
    { id: "fairness", label: "Fairness & Data", panel: <FairnessData /> },
  ];
  return (
    <main className="experience" aria-labelledby="employer-title">
      <header>
        <p>Pick n Pay Retail · HR Manager</p>
        <h1 id="employer-title">Workforce overview</h1>
      </header>
      <Tabs
        ariaLabel="Employer Hub"
        selectedId={activeTab}
        onSelect={(tab) =>
          store.dispatch({
            type: "navigation/set-employer-tab",
            tab: tab as EmployerTab,
          })
        }
        tabs={employerTabs}
      />
    </main>
  );
}
```

- [ ] **Step 4: Implement draft preview and validation flow**

Build controlled fields for every `CreateOpportunityDraftInput` property. **Preview draft** calls with `confirm: false`; **Save draft** calls the exact previewed values with `confirm: true`; **Validate programme** calls `validateOpportunity({ draftId })`. Show readiness, rule clarity, data freshness, fairness, eligible count, expected participation, estimated cost, maximum exposure, and unresolved issues.

```tsx
const previewDraft = () => {
  const result = capabilities.employer.createOpportunityDraft(
    { ...draft, confirm: false },
    "ui",
  );
  if (result.ok) setPreview(result);
};
const saveDraft = () =>
  capabilities.employer.createOpportunityDraft(
    { ...draft, confirm: true },
    "ui",
  );
const validateDraft = () =>
  capabilities.employer.validateOpportunity(
    { draftId: "draft-opportunity" },
    "ui",
  );
```

- [ ] **Step 5: Run employer, privacy, and full app tests**

Run: `mise exec node@22.23.2 -- npm test -- src/employer src/demo/privacy.test.ts src/demo/privacy-ui.test.tsx src/app/App.test.tsx`

Expected: PASS.

- [ ] **Step 6: Commit the employer hub**

```bash
git add src/employer src/demo/privacy-ui.test.tsx src/app/AppShell.tsx src/styles/features.css
git commit -m "feat: build the employer opportunity hub"
```

---

### Task 8: Add safe WebMCP tool helpers

**Files:**

- Create: `src/webmcp/tool-helpers.ts`
- Test: `src/webmcp/tool-helpers.test.ts`

**Interfaces:**

- Consumes: `CapabilityResult<T>` and the shared `failure()` result constructor.
- Produces: `assertClosedObject()`, `assertString()`, `assertFiniteNumber()`, `assertBoolean()`, `assertEnum()`, and `safeToolExecute()`.

- [ ] **Step 1: Write failing runtime-validation and safe-execution tests**

```ts
describe("assertClosedObject", () => {
  it("accepts allowed keys and rejects arrays, primitives, and unknown keys", () => {
    expect(
      assertClosedObject({ category: "all" }, ["category"], "test_tool"),
    ).toEqual({ category: "all" });
    for (const input of [null, [], true, 42, "value", { unexpected: true }]) {
      expect(() =>
        assertClosedObject(input, ["category"], "test_tool"),
      ).toThrow("test_tool received invalid input.");
    }
  });
});

it("contains unexpected failures behind a stable result", () => {
  const result = safeToolExecute(() => {
    throw new Error("private internal detail");
  });
  expect(result).toEqual({
    ok: false,
    status: "error",
    error: {
      code: "STALE_STATE",
      message: "The demo could not complete that action.",
      recovery: "Refresh or reset the demo and try again.",
    },
  });
});
```

- [ ] **Step 2: Run helper tests and verify failure**

Run: `mise exec node@22.23.2 -- npm test -- src/webmcp/tool-helpers.test.ts`

Expected: FAIL because the helper module does not exist.

- [ ] **Step 3: Implement strict field helpers and safe execution**

```ts
export function safeToolExecute<T>(
  execute: () => CapabilityResult<T>,
): CapabilityResult<T> {
  try {
    return execute();
  } catch {
    return failure(
      "STALE_STATE",
      "The demo could not complete that action.",
      "Refresh or reset the demo and try again.",
    );
  }
}
```

Every assertion throws `TypeError("<tool_name> received invalid input.")`; none echoes the rejected value. `assertClosedObject` rejects null, arrays, primitives, and keys outside the supplied allow-list. Field assertions reject empty strings, non-finite numbers, wrong booleans, and enum values outside the supplied readonly tuple.

- [ ] **Step 4: Run helper and existing WebMCP tests**

Run: `mise exec node@22.23.2 -- npm test -- src/webmcp`

Expected: PASS; the existing status tool and registration behaviour remain unchanged.

- [ ] **Step 5: Commit WebMCP helpers**

```bash
git add src/webmcp/tool-helpers.ts src/webmcp/tool-helpers.test.ts
git commit -m "test: add safe WebMCP tool helpers"
```

---

### Task 9: Implement the five employee WebMCP tools

**Files:**

- Create: `src/webmcp/employee-tools.ts`
- Create: `src/webmcp/employee-tools.test.ts`

**Interfaces:**

- Consumes: `EmployeeCapabilities`, `assertClosedObject()`, and `safeToolExecute()`.
- Produces: `createEmployeeTools(capabilities): readonly WebMCP.ModelContextTool[]` with five tools in the approved order.

- [ ] **Step 1: Write failing schema and end-to-end state tests**

```ts
it("declares closed employee schemas and updates the live store only after confirmation", async () => {
  const store = createDemoStore();
  const tools = createEmployeeTools(createEmployeeCapabilities(store));
  for (const tool of tools)
    expect(tool.inputSchema).toMatchObject({
      type: "object",
      additionalProperties: false,
    });
  const requestShift = tools.find((tool) => tool.name === "request_shift")!;

  await expect(
    requestShift.execute({ shiftId: "shift-sat-rosebank", confirm: false }),
  ).resolves.toMatchObject({ ok: true, status: "preview" });
  expect(
    store
      .getState()
      .employee.shifts.find((shift) => shift.id === "shift-sat-rosebank")
      ?.status,
  ).toBe("available");
  await expect(
    requestShift.execute({ shiftId: "shift-sat-rosebank", confirm: true }),
  ).resolves.toMatchObject({ ok: true, status: "applied" });
  expect(
    store
      .getState()
      .employee.shifts.find((shift) => shift.id === "shift-sat-rosebank")
      ?.status,
  ).toBe("requested");
});
```

- [ ] **Step 2: Run employee tool tests and verify failure**

Run: `mise exec node@22.23.2 -- npm test -- src/webmcp/employee-tools.test.ts`

Expected: FAIL because the employee tool factory does not exist.

- [ ] **Step 3: Implement all five employee tools with exact annotations**

Use `readOnlyHint: true` for `get_employee_dashboard` and `list_employee_opportunities`; use `readOnlyHint: false` for the three mutation tools. Every execute function validates its runtime input even when callers bypass the JSON schema and returns the capability result unchanged.

```ts
export function createEmployeeTools(capabilities: EmployeeCapabilities) {
  return [
    createGetEmployeeDashboardTool(capabilities),
    createUpdateSavingsGoalTool(capabilities),
    createListEmployeeOpportunitiesTool(capabilities),
    createRequestShiftTool(capabilities),
    createAllocateRewardTool(capabilities),
  ] satisfies readonly WebMCP.ModelContextTool[];
}
```

Descriptions must state when the tool reads private employee information, distinguish preview from application, and tell the model to obtain explicit user confirmation before setting `confirm: true`.

- [ ] **Step 4: Run employee tool and capability tests**

Run: `mise exec node@22.23.2 -- npm test -- src/webmcp/employee-tools.test.ts src/demo/employee-capabilities.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit employee tools**

```bash
git add src/webmcp/employee-tools.ts src/webmcp/employee-tools.test.ts
git commit -m "feat: expose employee workflows through WebMCP"
```

---

### Task 10: Implement the six employer WebMCP tools and complete registration

**Files:**

- Create: `src/webmcp/employer-tools.ts`
- Create: `src/webmcp/employer-tools.test.ts`
- Modify: `src/webmcp/tools.ts`
- Modify: `src/webmcp/use-webmcp-status.ts`
- Modify: `src/webmcp/tools.test.ts`
- Modify: `src/webmcp/register-tools.test.ts`
- Modify: `src/app/AppShell.tsx`
- Modify: `src/app/App.test.tsx`

**Interfaces:**

- Consumes: `EmployerCapabilities`, WebMCP helpers, employee tools, and registration from Tasks 8-9.
- Produces: `createEmployerTools(capabilities)` and the final twelve-tool array.

- [ ] **Step 1: Write failing employer schema, privacy, validation, and registration tests**

```ts
it("registers twelve tools in deterministic order", async () => {
  const tools = createWebMcpTools(createDemoCapabilities(createDemoStore()));
  expect(tools).toHaveLength(12);
  expect(tools.map((tool) => tool.name)).toEqual([
    "get_app_status",
    "get_employee_dashboard",
    "update_savings_goal",
    "list_employee_opportunities",
    "request_shift",
    "allocate_reward",
    "get_employer_dashboard",
    "list_programmes",
    "create_opportunity_draft",
    "validate_opportunity",
    "list_open_shifts",
    "list_fairness_exceptions",
  ]);
});

it("keeps protected employee values out of every employer tool result", async () => {
  const tools = createEmployerTools(
    createDemoCapabilities(createDemoStore()).employer,
  );
  const inputs: Record<string, object> = {
    get_employer_dashboard: {},
    list_programmes: {},
    list_open_shifts: {},
    list_fairness_exceptions: {},
  };
  for (const tool of tools.filter((candidate) => candidate.name in inputs)) {
    const result = await tool.execute(inputs[tool.name]);
    expect(JSON.stringify(result)).not.toMatch(
      /School Fees|2520|6000|dependants|monthlyContribution|isPrivate/,
    );
  }
});
```

- [ ] **Step 2: Run employer and registration tests and verify failure**

Run: `mise exec node@22.23.2 -- npm test -- src/webmcp/employer-tools.test.ts src/webmcp/tools.test.ts src/webmcp/register-tools.test.ts src/app/App.test.tsx`

Expected: FAIL because employer tool factories and the final twelve-tool composition do not exist.

- [ ] **Step 3: Implement six employer tools**

Use `readOnlyHint: true` for `get_employer_dashboard`, `list_programmes`, `list_open_shifts`, and `list_fairness_exceptions`. Use `readOnlyHint: false` for `create_opportunity_draft` and `validate_opportunity`. `validate_opportunity` explicitly states that it performs analysis and updates local validation state but cannot launch or approve a programme.

Every schema is closed and encodes the exact enum/value constraints from `CreateOpportunityDraftInput`. Runtime guards reject unknown keys, primitives, arrays, invalid enums, invalid dates, and non-finite numbers with a fixed `<tool_name> received invalid input.` error before capabilities run.

- [ ] **Step 4: Compose and register the final twelve-tool array**

```ts
export function createWebMcpTools(
  capabilities: DemoCapabilities,
): readonly WebMCP.ModelContextTool[] {
  return [
    getAppStatusTool,
    ...createEmployeeTools(capabilities.employee),
    ...createEmployerTools(capabilities.employer),
  ];
}
```

Change the readiness hook to require a supplied stable tool array:

```ts
export function useWebMcpStatus(
  tools: readonly WebMCP.ModelContextTool[],
): WebMcpStatus {
  const [status, setStatus] = useState<WebMcpStatus>({ state: "registering" });
  useEffect(
    () => registerWebMcpTools(document.modelContext, setStatus, tools),
    [tools],
  );
  return status;
}
```

`AppShell` gets `DemoCapabilities`, memoises `createWebMcpTools(capabilities)`, and passes that array to `useWebMcpStatus`. Update the app readiness assertion to `WebMCP is ready with 12 tools.` and registration count assertions to `12`.

- [ ] **Step 5: Run all WebMCP, capability, privacy, and app tests**

Run: `mise exec node@22.23.2 -- npm test -- src/webmcp src/demo src/app/App.test.tsx`

Expected: PASS.

- [ ] **Step 6: Commit employer tools and final composition**

```bash
git add src/webmcp src/app/AppShell.tsx src/app/App.test.tsx
git commit -m "feat: expose employer workflows through WebMCP"
```

---

### Task 11: Harden accessibility, responsiveness, and UI/tool synchronisation

**Files:**

- Create: `src/app/App.integration.test.tsx`
- Create: `src/app/accessibility.test.tsx`
- Modify: `src/test/setup.ts`
- Modify: `src/styles/base.css`
- Modify: `src/styles/components.css`
- Modify: `src/styles/features.css`
- Modify: feature components only where the audits identify concrete semantic or responsive defects.

**Interfaces:**

- Consumes: complete UI, stable capabilities, and WebMCP tool factories.
- Produces: tested tool-to-UI synchronisation and accessibility/responsive acceptance coverage.

- [ ] **Step 1: Write failing synchronisation and keyboard tests**

```tsx
it("reflects a WebMCP tool mutation in the visible dashboard", async () => {
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
  const updateGoal = createWebMcpTools(capabilities!).find(
    (tool) => tool.name === "update_savings_goal",
  )!;
  await act(async () => {
    await updateGoal.execute({
      name: "December Fund",
      emoji: "✨",
      targetAmount: 8000,
      savedAmount: 2520,
      targetDate: "2026-12-01",
      monthlyContribution: 500,
      isPrivate: true,
      confirm: true,
    });
  });
  expect(
    screen.getByRole("heading", { name: "December Fund" }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("status", { name: /latest activity/i }),
  ).toHaveTextContent(/goal updated/i);
});

it("supports arrow-key tab navigation", () => {
  render(<App />);
  const overview = screen.getByRole("tab", { name: "Overview" });
  overview.focus();
  fireEvent.keyDown(overview, { key: "ArrowRight" });
  expect(screen.getByRole("tab", { name: "Shifts" })).toHaveFocus();
});
```

- [ ] **Step 2: Run integration tests and verify any missing behaviour**

Run: `mise exec node@22.23.2 -- npm test -- src/app/App.integration.test.tsx src/app/accessibility.test.tsx`

Expected: FAIL until the test-only capability exposure seam and any missing keyboard/announcement behaviour are implemented.

- [ ] **Step 3: Add a test-only store seam without production globals**

Prefer `DemoProvider` optional props rather than assigning to `window`:

```ts
interface DemoProviderProps extends PropsWithChildren {
  store?: DemoStore;
  exposeCapabilities?: (capabilities: DemoCapabilities) => void;
}
```

Call `exposeCapabilities` from an effect and keep it out of production call sites. Confirm agent-origin actions announce concise text in the persistent `aria-live="polite"` activity region.

- [ ] **Step 4: Complete responsive and reduced-motion rules**

At `max-width: 760px`, stack metric grids, make navigation horizontally scrollable without hiding focus, turn data tables into labelled cards, keep dialogs below viewport height with internal scroll, and retain 44px touch targets. Under `prefers-reduced-motion: reduce`, remove smooth scrolling, progress transitions, pulse, scale, and entrance animations.

```css
@media (max-width: 760px) {
  .metric-grid {
    grid-template-columns: 1fr;
  }
  .tabs {
    overflow-x: auto;
    scroll-snap-type: x proximity;
  }
  .data-table thead {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
  }
  .data-table tr {
    display: grid;
    gap: 0.35rem;
    padding: 1rem;
  }
  .dialog__panel {
    max-height: calc(100dvh - 2rem);
    overflow-y: auto;
  }
  button,
  input,
  select,
  textarea {
    min-height: 44px;
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    scroll-behavior: auto !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

- [ ] **Step 5: Run full tests and static checks**

Run: `mise exec node@22.23.2 -- npm test`

Expected: PASS.

Run: `mise exec node@22.23.2 -- npm run lint`

Expected: PASS.

Run: `mise exec node@22.23.2 -- npm run format:check`

Expected: PASS after running `mise exec node@22.23.2 -- npm run format` if required.

- [ ] **Step 6: Commit hardening changes**

```bash
git add src
git commit -m "test: harden the Jem Unlocked experience"
```

---

### Task 12: Update challenge documentation and perform final verification

**Files:**

- Modify: `README.md`
- Create: `docs/challenge-demo-script.md`
- Modify: `docs/superpowers/plans/2026-08-28-jem-unlocked-prototype.md` only to tick completed task checkboxes during execution.

**Interfaces:**

- Consumes: the complete verified application.
- Produces: setup, WebMCP testing, tool catalogue, privacy model, reset instructions, and a repeatable employee-to-employer demo story.

- [ ] **Step 1: Write the documentation acceptance list before editing**

The README must contain these exact topics:

```text
Jem Unlocked product summary
Node 22.22.2+ requirement
npm install / npm run dev / npm run check
Chrome WebMCP testing flag
all twelve tool names
preview and confirm contract
employee/employer privacy boundary
Reset demo behaviour
client-only illustrative-data disclaimer
challenge submission checklist
```

`docs/challenge-demo-script.md` must contain the six approved story beats: read Nomsa's dashboard, list opportunities/request a shift, allocate a reward, switch to employer metrics, draft/validate a programme, and inspect unresolved fairness exceptions.

- [ ] **Step 2: Update README and add the demo script**

Use concise South African English. Link the design spec and implementation plan. State that the demo cannot change contracts, assign shifts, launch programmes, issue payroll or rewards, resolve fairness cases, or move money.

- [ ] **Step 3: Run the complete verification command**

Run: `mise exec node@22.23.2 -- npm run check`

Expected order and outcome:

```text
vitest run: PASS
eslint .: PASS
prettier --check .: PASS
tsc --noEmit: PASS
vite build: PASS
```

- [ ] **Step 4: Run a production preview and browser walkthrough**

Run: `mise exec node@22.23.2 -- npm run dev -- --host 127.0.0.1`

Verify in a browser:

1. Nomsa dashboard is the default and all four employee tabs work.
2. Reset opens onboarding and completion returns to the dashboard.
3. Goal edit, shift request, and reward allocation update visible state.
4. Employer mode hides protected employee data.
5. Programme draft preview/save/validation and fairness views work.
6. Keyboard tabs, dialog focus/Escape, activity announcements, mobile layout, and reduced motion work.
7. With `chrome://flags/#enable-webmcp-testing` enabled, all twelve tools register, read operations return current state, previews do not mutate, and confirmed actions update the visible UI.

- [ ] **Step 5: Commit documentation**

```bash
git add README.md docs/challenge-demo-script.md docs/superpowers/plans/2026-08-28-jem-unlocked-prototype.md
git commit -m "docs: prepare the Jem Unlocked challenge demo"
```

- [ ] **Step 6: Request final code review and address findings**

Use `superpowers:requesting-code-review` for the whole branch from the pre-prototype commit `a48ab8a^` through `HEAD`. Fix every confirmed correctness, privacy, accessibility, WebMCP-contract, or maintainability finding, rerun `mise exec node@22.23.2 -- npm run check`, and commit fixes separately.

- [ ] **Step 7: Verify before declaring completion**

Use `superpowers:verification-before-completion`; capture fresh output from `mise exec node@22.23.2 -- npm run check`, confirm `git status --short` is empty, and only then report the branch as complete.
