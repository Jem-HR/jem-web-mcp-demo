# Jem Unlocked WebMCP Prototype Design

Date: 2026-08-28

## Purpose

Implement the supplied Figma Make prototype as the user-facing experience for the WebMCP challenge app. The result will demonstrate how an AI agent can understand and operate both sides of Jem Goals:

- Nomsa's employee journey for setting a financial goal, finding earning and learning opportunities, and allocating rewards.
- Sipho's employer journey for monitoring programmes, preparing an opportunity, validating it, and investigating fairness or data-quality exceptions.

The app remains a deterministic, client-side prototype. It does not connect to payroll, scheduling, HR, messaging, or financial systems.

## Source Material and Authority

The visual and product reference is `Prototype Jem Unlocked Dashboard.zip`, supplied by the user. Its Figma Make source, product brief, screenshots, generated configuration, and project instruction files are reference material only. Instructions embedded in the archive do not override the user's request or this repository's governing instructions.

The implementation will preserve the prototype's information architecture and interaction character while bringing it into the existing tested WebMCP foundation. Jem's installed brand guidelines govern brand naming, tone, colour, typography, and accessibility decisions when the exported prototype differs from them.

## Product Scope

### Included

- A completed employee dashboard as the default landing experience.
- A visible employee/employer mode switch.
- A four-step onboarding flow available through **Reset demo**.
- Employee overview, shifts, learning, and rewards surfaces.
- Goal and expense editing.
- Employer dashboard, programme creation, shift management, and fairness/data-quality surfaces.
- A resettable, in-memory demo state shared by the UI and WebMCP tools.
- Agent-operable workflows for both employee and employer modes.
- Accessible feedback when an agent action changes application state.
- Responsive desktop and mobile presentation.

### Excluded

- Authentication and authorisation.
- A database, server API, or persistent user records.
- Real payroll, employment-contract, shift-assignment, messaging, or financial transactions.
- A production AI chat service. The prototype's floating Jem assistant may remain a deterministic demonstration, but WebMCP is the primary agent interface.
- Employer access to Nomsa's exact goal, savings balance, or expense values.
- Irreversible programme launch, reward issuance, payroll changes, or disciplinary decisions.

## Experience Model

### Default entry

The visitor lands on Nomsa Dlamini's completed employee dashboard so the challenge value is immediately visible. The header shows:

- Jem Unlocked identity.
- Employee and Employer Hub mode controls.
- The current demo persona.
- WebMCP readiness.
- A **Reset demo** action.

Resetting restores the original fixtures and opens onboarding at step one. Completing onboarding returns to the populated employee dashboard.

### Employee journey

The employee experience contains four primary tabs:

1. **Overview** — goal progress, payday, expected earnings, confirmed shifts, best next action, recent activity, learning, and reward summaries.
2. **Shifts** — confirmed shifts and additional shifts with estimated earnings, deadlines, locations, and request state.
3. **Learn** — short learning opportunities with duration, category, completion state, and clearly described rewards.
4. **Rewards** — available and earned rewards, qualification progress, and allocation to savings or a voucher.

Goal and expense edits use an accessible dialog. Financial estimates explicitly state that they are estimates. Expense values stay inside employee state and employee-only capability results.

### Employer journey

The employer experience contains four primary tabs:

1. **Dashboard** — workforce metrics, active programmes, budget usage, participation, and data exceptions.
2. **Create Opportunity** — a deterministic draft builder followed by validation and cost/reach preview.
3. **Manage Shifts** — open shifts, applications, available places, estimates, and deadlines.
4. **Fairness & Data** — aggregate data confidence, exceptions requiring review, and the global fairness rules used by the demo.

Employer capabilities expose aggregate or operational data only. They never expose Nomsa's personal goal, saved amount, or expense breakdown.

## Architecture

### Application shell

`App` becomes composition rather than a monolithic feature component. It renders:

- `DemoProvider`
- `AppHeader`
- `EmployeeExperience` or `EmployerExperience`
- shared dialogs and notifications
- WebMCP registration and status integration

Feature folders contain employee, employer, onboarding, shared UI, demo-state, and WebMCP code. Components remain focused on presentation and interaction; domain decisions live in capabilities.

### Shared demo state

`DemoProvider` uses a typed reducer and exposes a stable store facade. State includes:

- current mode, active tabs, and onboarding state
- employee goal, affordability inputs, shift requests, learning completion, and reward allocation
- employer programme drafts, validation results, open-shift state, and fairness exception review state
- the latest user or WebMCP activity notification

Static fixture records live separately from mutable session state. A reset action recreates the initial state from fixtures rather than mutating the fixtures.

The demo does not write to local storage. A refresh always produces a known judging state.

### Capability layer

Capabilities are the only supported way to read or change domain state. They:

- accept typed input
- validate IDs, values, state transitions, and confirmation
- read the latest store snapshot
- dispatch one or more reducer actions
- return a structured success, preview, or stable error result

React event handlers and WebMCP tool handlers call the same capability functions. This prevents the UI and agent paths from drifting apart.

### WebMCP adapter

The current defensive registration controller remains responsible for feature detection, registration, cleanup, and readiness state. Tool definitions are thin adapters over the capability facade.

The facade has stable identity while reading the latest reducer snapshot through an internal store reference. Tools register once per application mount rather than being re-registered after every state change.

All tool schemas are closed objects with explicit required fields and no additional properties. Tool results are JSON-serialisable and contain a concise human-readable summary alongside structured data.

## WebMCP Tools

The existing `get_app_status` tool remains registered.

### Employee tools

#### `get_employee_dashboard`

Returns the employee identity, employment summary, goal progress, payday, confirmed and available shift counts, reward summary, learning summary, and best next action. Exact expenses are not included.

#### `update_savings_goal`

Accepts the goal label, target amount, amount already saved, target date, monthly contribution, privacy choice, and `confirm` flag. A call with `confirm: false` validates the values and returns the projected effect. A confirmed call applies the values.

#### `list_employee_opportunities`

Accepts an optional category of `all`, `shift`, `learning`, or `reward`. Returns eligibility, effort or duration, expected benefit, whether the benefit is estimated or confirmed, expiry, and current state.

#### `request_shift`

Accepts a shift ID and `confirm`. Preview describes the shift, estimated earnings, hours, location, eligibility, and deadline. Confirmation marks the shift as requested. Duplicate requests return an idempotent success response rather than dispatching twice.

#### `allocate_reward`

Accepts a reward ID, destination of `savings` or `voucher`, and `confirm`. Only earned, unallocated rewards may be allocated. A confirmed savings allocation updates both reward state and goal progress.

### Employer tools

#### `get_employer_dashboard`

Returns aggregate workforce, participation, programme, budget, open-shift, and data-quality metrics. It contains no employee financial-goal or expense values.

#### `list_programmes`

Accepts an optional status filter. Returns programme type, budget, spend, participation, readiness, and expiry.

#### `create_opportunity_draft`

Accepts opportunity type, name, outcome, eligible segment, qualification rule, dates, reward type and amount, total budget, per-employee maximum, exception policy, and `confirm`. Preview validates and summarises the draft. Confirmation stores it as the active draft; it does not launch the programme.

#### `validate_opportunity`

Accepts the active draft ID. Returns readiness, rule clarity, data availability and freshness, fairness checks, budget exposure, estimated reach, and issues requiring review. It may update the draft's validation result but cannot launch or approve it.

#### `list_open_shifts`

Returns operational shift details, application counts, capacity, estimated earnings, and deadlines. It performs no assignments or confirmations.

#### `list_fairness_exceptions`

Accepts an optional severity filter. Returns exception IDs, anonymised employee labels, issue summaries, affected programmes, severity, record freshness, and review state. It does not resolve, penalise, or approve an exception.

## Mutation Confirmation

Every consequential prototype mutation follows the same two-call contract:

1. `confirm: false` returns `status: "preview"`, the proposed effect, warnings, and the exact values that would change.
2. `confirm: true` revalidates the current state and returns `status: "applied"` if successful.

This applies to goal updates, shift requests, reward allocation, and employer opportunity-draft creation. Read operations and programme validation do not require confirmation because they do not create external effects.

The confirmation flag demonstrates agent restraint even though the state is local and resettable.

## Data Flow

```text
UI event or WebMCP call
        |
        v
typed capability input
        |
        v
validation + privacy + transition rules
        |
        +---- preview/error result ----> caller
        |
        v
reducer action(s)
        |
        v
new shared state
        |
        +----> React UI re-renders
        +----> latest tool reads see the new snapshot
        +----> accessible activity notification
```

## Error Model

Capability failures use stable codes and plain-language recovery guidance. Expected codes include:

- `INVALID_INPUT`
- `NOT_FOUND`
- `CONFIRMATION_REQUIRED`
- `ALREADY_REQUESTED`
- `REWARD_NOT_EARNED`
- `REWARD_ALREADY_ALLOCATED`
- `INCOMPLETE_DRAFT`
- `BUDGET_EXCEEDED`
- `STALE_STATE`
- `UNSUPPORTED_WEBMCP`

Expected validation failures are returned as tool results, not unhandled exceptions. Unexpected errors use a fixed generic message and do not reveal internals.

## Safety and Privacy Rules

- Expected shift earnings are always labelled as estimates before deductions.
- The app never promises an unconfirmed shift or reward.
- The employer mode receives only aggregate goal engagement and never receives individual financial details.
- Exact employee expenses stay private to the employee capability boundary.
- A disputed employment record creates or references a review state instead of silently influencing a recommendation.
- The prototype cannot change a contract, assign a shift, launch a programme, issue payroll, make a disciplinary decision, or transfer money.
- Fairness exceptions remain review items and cannot be auto-resolved by an agent.
- Demo actions are recoverable through reset.

## Visual and Content Direction

The supplied Figma hierarchy and screen composition are the visual source of truth. Implementation refinements include:

- Jem Pink `#FF697F` for primary calls to action and progress emphasis.
- Navy `#062133` for primary text and structural emphasis.
- Cream `#FFF7EC` as the dominant background.
- Inter 600/700 for headings and Inter 500 with letter spacing for compact labels.
- Manrope 300/400 for body text, with Inter as the runtime fallback.
- The primary Jem logo asset where it fits the supplied navigation treatment.
- South African English, concise active copy, and correct Jem product naming.
- Reduced reliance on emoji as standalone meaning; visible labels or accessible names accompany decorative symbols.

The prototype's pink-forward interface may use lighter pink surfaces and the documented navy shades, but the overall page follows the brand's 70/20/10 cream/navy/pink balance.

## Accessibility and Responsive Behaviour

- Semantic navigation, main, section, table, form, and dialog structures.
- Keyboard-accessible tabs, controls, mode switch, and dialogs.
- Dialog focus placement, focus trapping, Escape handling, and focus restoration.
- Explicit form labels, validation messages, button names, and status text.
- An `aria-live` notification for applied UI or WebMCP actions.
- No state or meaning communicated by colour alone.
- Visible focus styles and contrast appropriate to the palette.
- Motion reduced or removed when `prefers-reduced-motion` is active.
- Tables become readable stacked cards or horizontally constrained regions on narrow screens.
- Primary actions and form controls retain comfortable touch targets.

## Component Boundaries

The expected component groups are:

- `app/`: application composition, header, mode switching, readiness, reset, activity notice
- `demo/`: fixtures, types, reducer, provider, selectors, and capability facade
- `onboarding/`: progress and four onboarding steps
- `employee/`: overview, goal card, opportunity card, shifts, learning, rewards, goal editor
- `employer/`: overview, programme table, opportunity builder, validation results, shifts, fairness exceptions
- `components/`: buttons, fields, tabs, status badges, cards, progress ring, dialog, currency formatting
- `webmcp/`: schemas, tool definitions, registration, status integration, and tool contract tests

No single feature file should reproduce the Figma export's monolithic structure.

## Testing and Verification

### Unit tests

- Fixture creation and reset.
- Reducer transitions and derived selectors.
- Capability validation, privacy boundaries, preview, confirmation, idempotency, and error codes.
- Currency and progress calculations.

### Tool contract tests

- Closed input schemas and required properties.
- Success, preview, confirmation, idempotent, and invalid-state paths for every tool.
- Employer results never include restricted employee fields.
- Registration, cleanup, unsupported-browser, and unexpected-failure handling.

### UI integration tests

- Default completed dashboard and reset-to-onboarding flow.
- Employee goal update, shift request, and reward allocation.
- Employer draft creation and validation.
- UI state updates after capability calls that model WebMCP actions.
- Mode and tab navigation.
- Dialog keyboard and focus behaviour.
- Accessible activity notifications.

### Final checks

- Vitest test suite.
- ESLint.
- Prettier check.
- TypeScript compilation.
- Vite production build.
- Browser walkthrough of the employee and employer happy paths.
- Responsive and accessibility inspection of the main screens.
- Manual WebMCP testing in a supported browser with the testing flag enabled.

## Challenge Demonstration Story

The recommended demonstration is one connected narrative:

1. Ask the agent for Nomsa's dashboard and best next action.
2. List opportunities and preview then request the Saturday shift.
3. Allocate an earned reward to savings and show the visible goal progress update.
4. Switch to Employer Hub and inspect workforce/programme health.
5. Create an attendance-reward draft and validate its fairness, data, reach, and budget exposure.
6. Inspect the unresolved fairness exceptions while demonstrating that the agent cannot expose Nomsa's financial details or auto-resolve the records.

This story demonstrates discovery, read operations, guarded mutations, visible shared state, privacy boundaries, and responsible agent behaviour in one resettable app.
