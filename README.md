# Jem Unlocked

Jem Unlocked is a complete, deterministic React prototype for the [OpenAI WebMCP Challenge](https://openai.com/webmcp-challenge/). It demonstrates a shared, resettable experience for Nomsa’s employee journey and Sipho’s employer journey, with the same domain capabilities available to the UI and WebMCP tools.

It is not a production Jem service. Read the local [design specification](docs/superpowers/specs/2026-08-28-jem-unlocked-prototype-design.md) and [implementation plan](docs/superpowers/plans/2026-08-28-jem-unlocked-prototype.md) for the agreed scope and implementation record.

## Prototype data and limits

Everything runs client-side with fixed illustrative data. There is no authentication, server, database, localStorage persistence, payroll, scheduling, HR, or financial-system connection. Employee and employer names, including initial-plus-surname fairness labels, are illustrative pseudonyms only; they are not a production anonymity guarantee.

The prototype can demonstrate state changes, but it cannot change employment contracts, assign shifts, launch programmes, issue payroll or rewards, resolve fairness cases, or move money.

## Requirements and local setup

- Node.js 22.22.2 or newer
- npm 10 or newer

```bash
npm install
npm run dev
```

Vite serves the prototype at `http://localhost:5173` by default.

Run the complete quality gate with:

```bash
npm run check
```

The check runs Vitest, ESLint, Prettier, TypeScript, and a production Vite build.

## UI journeys

The default landing view is Nomsa Dlamini’s completed employee dashboard. Its four tabs are Overview, Shifts, Learn, and Rewards. Use the header mode control to open the Employer Hub for aggregate programme, opportunity, shift, and fairness views.

Use **Reset demo** to restore every fixture and open onboarding at step 1. Completing onboarding returns to the populated employee dashboard. A page refresh instead restores the known completed employee landing state because the prototype persists nothing to localStorage or a server.

## WebMCP testing

WebMCP is progressive enhancement: a browser without `document.modelContext` still renders the prototype.

### ChatGPT in-app Browser

1. Start the local app, then open it in ChatGPT’s in-app Browser.
2. Open **Site tools** from the browser address bar.
3. Confirm the Jem Unlocked tools are available and exercise the read, preview, and confirmed examples in the [challenge demo script](docs/challenge-demo-script.md).

### Google Chrome

1. Open `chrome://flags/#enable-webmcp-testing`.
2. Enable WebMCP testing and restart Chrome.
3. Open the local app in a top-level tab, then use a compatible browser agent to discover the tools.

## WebMCP tool catalogue

Tools are registered in this order. Schemas are closed objects: unexpected fields are rejected.

1. `get_app_status` — read the completed prototype status.
2. `get_employee_dashboard` — read Nomsa’s private employee dashboard.
3. `update_savings_goal` — preview, then update a private savings goal.
4. `list_employee_opportunities` — read available shift, learning, and reward opportunities.
5. `request_shift` — preview, then record a shift request.
6. `allocate_reward` — preview, then allocate an earned reward to savings or a voucher.
7. `get_employer_dashboard` — read aggregate employer metrics.
8. `list_programmes` — read aggregate programme operations.
9. `create_opportunity_draft` — preview, then save an aggregate opportunity draft.
10. `validate_opportunity` — run local aggregate draft analysis.
11. `list_open_shifts` — read aggregate open-shift operations.
12. `list_fairness_exceptions` — read anonymised fairness exceptions.

The four consequential tools are `update_savings_goal`, `request_shift`, `allocate_reward`, and `create_opportunity_draft`. Call each with `confirm: false` first, present the returned preview, ask for explicit user confirmation, and only then call it with `confirm: true`. A preview must not mutate state.

`validate_opportunity` updates local analysis state only and needs no confirmation. It cannot approve or launch a programme. `update_expenses` is intentionally UI-only: there is no WebMCP expense tool.

## Privacy and safety boundary

The employee dashboard and goal tools handle private employee data. Employer tools return only aggregate operational or anonymised DTOs; they cannot expose Nomsa’s goal, saved amount, target amount, monthly contribution, privacy choice, or expenses. The prototype’s initial-plus-surname labels support the demonstration only and must not be treated as a production privacy guarantee.

State-changing tools use previews and explicit confirmation. They remain demonstrations: a recorded shift request is not an assignment, a saved opportunity remains a draft, and a reward allocation does not issue a real reward or payment.

## Architecture

- `src/demo` contains fixtures, the resettable store, selectors, and shared capabilities.
- `src/employee` and `src/employer` render the two product experiences.
- `src/webmcp` contains strict tool adapters and WebMCP registration.

React interactions and tool handlers call the same capabilities, so a confirmed tool action updates the visible in-memory UI state.

## Challenge submission checklist

Prepare these items before submitting; this list does not claim that deployment or submission is complete.

- [x] Repository-local prototype and tool documentation prepared.
- [x] Local quality command documented.
- [ ] Public deployment URL prepared.
- [ ] Screenshots or demo video prepared.
- [ ] Challenge submission completed.

## Licence

[MIT](LICENSE)
