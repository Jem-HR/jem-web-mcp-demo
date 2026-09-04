# Jem Unlocked

**An agent that can act for a frontline worker without ever seeing what she is
saving for.**

Jem Unlocked is a WebMCP prototype built for the
[OpenAI WebMCP Challenge](https://openai.com/webmcp-challenge/). It models the
real product surface of [Jem](https://www.jemhr.com), an HR and financial
wellbeing platform used by South African frontline workers — retail staff,
security officers, cleaners — and the employers who schedule and pay them.

Two people share one web app. Nomsa is a senior sales associate saving for
school fees. Sipho runs workforce programmes at her employer. The same page
exposes tools to an AI agent — and **which tools exist depends on who is
looking.** While the Employer Hub is open, no employee-private tool is
registered at all: `document.modelContext` has nothing that can read Nomsa's
savings goal, so there is no instruction an agent could be given to retrieve
it.

That is the part a server-side tool host cannot do. Registration is bound to
what is on screen.

**Live demo:** https://jem-hr.github.io/jem-web-mcp-demo/

## Why this is a WebMCP problem, not a chatbot problem

Frontline workers do not sit at desks. The gap between "I want to pick up
Saturday's shift and put the extra towards school fees" and the six taps needed
to do it is where engagement dies. An agent can close that gap — but only if it
can act on the _real_ application state, not a scraped approximation of it.

WebMCP is the right primitive because the page already knows three things a
server-side agent integration does not:

1. **Who is looking.** Tool registration follows the active mode, so the
   privacy boundary is structural rather than instructed. Employer tools are
   additionally wired to a capability layer that cannot produce private
   employee fields — two independent layers, so a mistake in either one does
   not leak.
2. **What is currently on screen.** A confirmed tool call updates the same
   in-memory store the UI renders, so the human watches the agent's work land
   in the interface in real time.
3. **What is consequential.** Money-adjacent actions are gated behind a
   preview-then-confirm contract the page controls, so an agent cannot move a
   worker's savings on a single ambiguous instruction.

## What people and agents can do together here

Previously each of these was a multi-screen manual task, or impossible for an
agent that could only read the DOM:

- "What shifts can I pick up this Saturday?" — the agent lists real open
  shifts and returns a preview with hours and estimated earnings before
  deductions, then records the request only after Nomsa confirms.
- "Put my safety award into the school fees goal" — the agent previews the
  allocation, and on confirmation the goal ring, the total and the activity
  feed all move on screen.
- "Am I on track?" — the agent reads live dashboard state, not a stale export.
- Sipho asks "who is being under-offered shifts?" — the agent reads anonymised
  fairness exceptions and can draft a programme against them. Ask that same
  agent what Nomsa is saving for and it has no tool that can answer.

## Testing WebMCP

WebMCP is progressive enhancement: a browser without `document.modelContext`
still renders the full prototype.

**ChatGPT in-app browser** — open the live demo, then open **Site tools** from
the address bar. You will see six tools on the employee view; switch to the
Employer Hub and the list becomes a different seven.

**Google Chrome 149+** — enable `chrome://flags/#enable-webmcp-testing`,
restart, then open the live demo in a top-level tab.

Walkthrough prompts are in the
[challenge demo script](docs/challenge-demo-script.md).

## How WebMCP is implemented

Every tool is registered through `document.modelContext.registerTool` with a
closed input schema, an `AbortSignal` for clean teardown, and a runtime
validator that mirrors the schema so a malformed agent call is rejected with a
structured error rather than a thrown exception:

```js
document.modelContext.registerTool(
  {
    name: "request_shift",
    title: "Request shift",
    description:
      "Prepare a request for an available employee shift. confirm:false previews without mutation; set confirm:true only after explicit user confirmation to apply it.",
    inputSchema: {
      type: "object",
      properties: {
        shiftId: { type: "string", minLength: 1 },
        confirm: { type: "boolean" },
      },
      required: ["shiftId", "confirm"],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: false },
    execute: async (input) => capabilities.requestShift(input, "webmcp"),
  },
  { signal: controller.signal },
);
```

Tool handlers and React event handlers call the **same capability layer**
(`src/demo/capabilities.ts`), so there is no separate agent code path that can
drift from the UI. That shared layer is what makes agent actions show up
visibly on screen.

### Tool catalogue

Twelve tools exist. **Six or seven are registered at any one time**, because
registration follows the mode on screen — so if you count tools in Site tools
and see six, that is the design working, not tools failing to load:

| Mode on screen     | Registered tools                               |
| ------------------ | ---------------------------------------------- |
| Employee (default) | 6 — `get_app_status` + the five employee tools |
| Employer Hub       | 7 — `get_app_status` + the six employer tools  |

Switching mode aborts the previous registration's `AbortSignal`, which
unregisters that whole set before the new one is registered. `get_app_status`
is the only tool present in both.

Schemas are closed objects: unexpected fields are rejected.

| Tool                          | Reads / writes | Notes                                        |
| ----------------------------- | -------------- | -------------------------------------------- |
| `get_app_status`              | read           | Prototype status                             |
| `get_employee_dashboard`      | read           | Nomsa's private dashboard                    |
| `update_savings_goal`         | **write**      | Preview, then confirm                        |
| `list_employee_opportunities` | read           | Shifts, learning, rewards                    |
| `request_shift`               | **write**      | Preview, then confirm                        |
| `allocate_reward`             | **write**      | To savings or voucher; preview, then confirm |
| `get_employer_dashboard`      | read           | Aggregates only                              |
| `list_programmes`             | read           | Aggregates only                              |
| `create_opportunity_draft`    | **write**      | Preview, then confirm; stays a draft         |
| `validate_opportunity`        | analysis       | Local draft analysis; cannot launch          |
| `list_open_shifts`            | read           | Aggregates only                              |
| `list_fairness_exceptions`    | read           | Anonymised                                   |

The four consequential tools are `update_savings_goal`, `request_shift`,
`allocate_reward` and `create_opportunity_draft`. Call each with
`confirm: false` first, present the returned preview, obtain explicit user
confirmation, then call with `confirm: true`. **A preview never mutates state.**

`update_expenses` is deliberately UI-only — there is no WebMCP expense tool, to
show that exposing a capability to an agent is a decision, not a default.

## The privacy boundary

Two independent layers, because one is not enough for financial data:

1. **Registration.** While the Employer Hub is open, employee-private tools are
   not registered, so an agent has nothing to call. Verified in
   `src/app/App.test.tsx`, which asserts the employee registration's signal is
   aborted on mode change and that no employee-private tool appears in the
   employer set.
2. **Projection.** Even so, employer tools return only aggregate or anonymised
   DTOs. They cannot expose Nomsa's goal, saved amount, target amount, monthly
   contribution, privacy choice or expenses. Privacy sentinel tests assert
   every employer tool and DTO against the private field set — see
   `src/demo/privacy.test.ts`.

The initial-plus-surname fairness labels support the demonstration only and are
not a production anonymity guarantee.

## Running locally

Requires **Node.js 22.22.2+** and npm 10+. The test suite will not run on
Node 20 — jsdom raises `ERR_REQUIRE_ESM`.

```bash
npm install
npm run dev     # http://localhost:5173
npm run check   # vitest, eslint, prettier, tsc, production build
```

`npm run check` runs 122 tests across 21 files.

## Prototype scope and limits

Everything runs client-side against fixed illustrative data. There is no
authentication, server, database, persistence, payroll, scheduling or financial
system behind it, and no real Jem customer data. Names are pseudonyms.

The prototype demonstrates state changes but cannot change employment
contracts, assign shifts, launch programmes, issue payroll or rewards, resolve
fairness cases, or move money. A recorded shift request is not an assignment; a
saved opportunity remains a draft; a reward allocation issues nothing.

**Reset demo** in the header restores every fixture and reopens onboarding.

## Architecture

- `src/demo` — fixtures, resettable store, selectors, shared capability layer
- `src/employee`, `src/employer` — the two product experiences
- `src/webmcp` — tool adapters, strict input validation, registration

Design notes and the implementation record are in
[`docs/`](docs/superpowers/specs/2026-08-28-jem-unlocked-prototype-design.md).

## Licence

[MIT](LICENSE)
