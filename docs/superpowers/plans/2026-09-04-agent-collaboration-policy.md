# Agent Collaboration Policy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to execute this plan task by task.

**Goal:** Make the Jem WebMCP demo a credible, policy-aware agent collaboration product: an agent can discover its current actor context, propose consequential actions, receive explicit human approval, execute only the approved proposal, and leave an explainable audit trail.

**Architecture:** Keep the demo client-only and deterministic, but model the production boundaries explicitly. A simulated actor session resolves into a capability policy; policies determine tool exposure and human-facing view. Consequential capabilities create immutable proposals first, and guarded execution verifies actor, policy, state revision, input fingerprint, expiry, and one-time use. Domain state records savings intent, deterministic recommendations, and structured audit events.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, React Testing Library, Zod, WebMCP browser API, existing Jem design tokens.

**Spec:** `docs/superpowers/specs/2026-09-04-agent-collaboration-policy-design.md`

## Global constraints

- Treat every actor identity and policy as simulated demo data; do not imply production authentication or authorization.
- Do not use `confirm: true` or any caller-controlled equivalent as an authorization mechanism.
- Preserve deterministic fixtures and no-network operation.
- Do not expose an employee mutation to the employer actor, or vice versa.
- Keep the tool payloads structured and error codes explicit so an external agent can recover without guessing.
- Preserve keyboard support, visible focus states, colour contrast, responsive layouts, and concise Jem tone.

---

### Task 1: Add simulated actor policy, revisions, and audit primitives

**Files:**
- Create: `src/demo/policy.ts`
- Create: `src/demo/policy.test.ts`
- Modify: `src/demo/types.ts`
- Modify: `src/demo/fixtures.ts`
- Modify: `src/demo/reducer.ts`
- Modify: `src/demo/store.test.ts`

1. Write failing policy tests for employee and employer sessions: actor identity, display label, permitted capability names, and disallowed names.
2. Add `ActorId`, `ActorSession`, `CapabilityPolicy`, `AgentAuditEvent`, `StateRevision`, and audit event type unions to `types.ts`. Add `actorSession`, `revision`, `auditEvents`, and `savingsIntent` placeholders to `DemoState`.
3. Implement a pure `policyForSession(session)` resolver in `policy.ts`. Its returned policy must include a stable `revision`, permitted tool names, actor label, and view mode. Export a pure `isToolPermitted(policy, toolName)` helper.

```ts
export function isToolPermitted(policy: CapabilityPolicy, toolName: string): boolean {
  return policy.permittedTools.includes(toolName);
}
```

4. Seed the fixture with the employee session, revision `1`, and an empty audit list. Add reducer actions for changing the simulated actor and recording audit events. Increment `state.revision` exactly once for every business-state mutation, but not for a read-only context lookup.
5. Record mode/actor policy changes and business mutations as compact, redacted audit events; do not place raw proposal input or user-entered free text into an event.
6. Run `npm test -- src/demo/policy.test.ts src/demo/store.test.ts` and make the tests pass.
7. Commit:

```bash
git add src/demo/policy.ts src/demo/policy.test.ts src/demo/types.ts src/demo/fixtures.ts src/demo/reducer.ts src/demo/store.test.ts
git commit -m "feat: add simulated actor policy and audit state"
```

### Task 2: Introduce deterministic action proposals and guarded execution

**Files:**
- Create: `src/demo/proposals.ts`
- Create: `src/demo/proposals.test.ts`
- Modify: `src/demo/types.ts`
- Modify: `src/demo/capability-result.ts`
- Modify: `src/demo/reducer.ts`
- Modify: `src/demo/capability-result.test.ts`

1. Write failing tests that construct a proposal and reject execution when its actor, policy revision, state revision, input fingerprint, expiry, or status no longer matches.
2. Define `ActionProposal` with `id`, `action`, `actorId`, `policyRevision`, `inputFingerprint`, `stateRevision`, `expiresAt`, `warnings`, `effects`, `status`, and optional execution metadata. Store proposals in `DemoState`.
3. Implement deterministic helpers in `proposals.ts`: canonical input fingerprinting, proposal creation, proposal lookup, and `verifyExecutableProposal`.
4. Extend capability errors with `POLICY_DENIED`, `PROPOSAL_NOT_FOUND`, `PROPOSAL_MISMATCH`, `STALE_PROPOSAL`, `EXPIRED_PROPOSAL`, and `ALREADY_EXECUTED`. Return a recoverable error object with the error code and a concise next step.
5. Add reducer actions that create a proposal, execute it once, and invalidate outstanding proposals when a relevant business-state revision changes. Retain invalidated proposals for the audit UI rather than deleting them.
6. Run `npm test -- src/demo/proposals.test.ts src/demo/capability-result.test.ts` and make the tests pass.
7. Commit:

```bash
git add src/demo/proposals.ts src/demo/proposals.test.ts src/demo/types.ts src/demo/capability-result.ts src/demo/capability-result.test.ts src/demo/reducer.ts
git commit -m "feat: guard consequential actions with proposals"
```

### Task 3: Migrate employee mutations from caller confirmation to proposal/execute phases

**Files:**
- Modify: `src/demo/employee-capabilities.ts`
- Modify: `src/demo/employee-capabilities.test.ts`
- Modify: `src/webmcp/employee-tools.ts`
- Modify: `src/webmcp/employee-tools.test.ts`
- Modify: `src/demo/capabilities.ts`

1. Write failing capability tests showing that `phase: "propose"` for savings-goal update, shift request, and reward allocation creates a proposal without changing domain data.
2. Replace each `confirm` input with a discriminated contract:

```ts
type ProposalPhase = { phase: "propose" } | { phase: "execute"; proposalId: string };
```

3. On proposal, enforce the current actor policy, create a proposal, record `proposal_created`, and return its warnings/effects. On execution, call `verifyExecutableProposal`, apply only the matching domain mutation, mark it executed, and record `proposal_executed`.
4. Preserve existing domain validation: non-negative savings goals, no duplicate shift request, only earned/unallocated rewards, and no silent over-allocation.
5. Replace Zod schemas and tool descriptions so WebMCP agents see `phase` and `proposalId`, never an agent-supplied authorization flag.
6. Add adversarial tests: employer cannot propose employee actions; a guessed proposal ID fails; executing an employee proposal as employer fails; an already-used proposal fails without a second mutation.
7. Run `npm test -- src/demo/employee-capabilities.test.ts src/webmcp/employee-tools.test.ts` and make the tests pass.
8. Commit:

```bash
git add src/demo/employee-capabilities.ts src/demo/employee-capabilities.test.ts src/demo/capabilities.ts src/webmcp/employee-tools.ts src/webmcp/employee-tools.test.ts
git commit -m "feat: require approved proposals for employee actions"
```

### Task 4: Add a truthful compound shift-to-goal intent workflow

**Files:**
- Modify: `src/demo/types.ts`
- Modify: `src/demo/reducer.ts`
- Modify: `src/demo/employee-capabilities.ts`
- Modify: `src/demo/employee-capabilities.test.ts`
- Modify: `src/webmcp/employee-tools.ts`
- Modify: `src/webmcp/employee-tools.test.ts`

1. Write failing tests for `prepareShiftToGoalPlan`: it must propose a shift request plus a future savings allocation intent, but must not increase the savings goal or allocate money that has not been earned.
2. Add `SavingsIntent` to state with its shift request reference, destination goal, allocation rule, and pending/ready/completed state.
3. Implement `prepareShiftToGoalPlan` as a consequential proposal. Its effects must explicitly distinguish: request a shift now; reserve an intent to allocate future earned reward; no current funds move.
4. When an earned reward arrives in the deterministic fixture path, make the associated intent ready for a separately approved allocation; never auto-transfer future earnings.
5. Expose `prepare_shift_to_goal_plan` with a schema that names the target goal and optional allocation amount. Return the created proposal and a clear explanation of the two required approvals.
6. Run the focused employee and WebMCP tool tests and make them pass.
7. Commit:

```bash
git add src/demo/types.ts src/demo/reducer.ts src/demo/employee-capabilities.ts src/demo/employee-capabilities.test.ts src/webmcp/employee-tools.ts src/webmcp/employee-tools.test.ts
git commit -m "feat: add honest shift-to-goal planning"
```

### Task 5: Make employer validation actionable and draft creation policy-aware

**Files:**
- Modify: `src/demo/employer-capabilities.ts`
- Modify: `src/demo/employer-capabilities.test.ts`
- Modify: `src/webmcp/employer-tools.ts`
- Modify: `src/webmcp/employer-tools.test.ts`
- Modify: `src/demo/types.ts`
- Modify: `src/app/employer/EmployerDashboard.tsx`
- Modify: `src/app/employer/EmployerDashboard.test.tsx`

1. Write failing tests that create an opportunity draft by proposal/execute phases, enforce employer policy, and return deterministic recommendations for invalid salary, budget, fairness, and freshness conditions.
2. Replace the employer draft `confirm` input with the same proposal contract used by employee mutations.
3. Extend `OpportunityValidation` with typed recommendations. Include only explainable aggregate-safe recommendations: reduce pay-gap exposure, raise/rebalance budget, resolve fairness flags, refresh stale data, and improve accessibility.
4. Return validation data without mutation; it is an advisory capability rather than a confirmation bypass.
5. Update the employer dashboard to render validation recommendations as readable, semantic status content with no private employee details.
6. Run employer capability, tool, and dashboard tests and make them pass.
7. Commit:

```bash
git add src/demo/employer-capabilities.ts src/demo/employer-capabilities.test.ts src/webmcp/employer-tools.ts src/webmcp/employer-tools.test.ts src/demo/types.ts src/app/employer/EmployerDashboard.tsx src/app/employer/EmployerDashboard.test.tsx
git commit -m "feat: add policy-aware employer recommendations"
```

### Task 6: Expose active context, register policy-safe tools, and surface approvals and audit in the UI

**Files:**
- Create: `src/app/agent/ProposalApprovalCard.tsx`
- Create: `src/app/agent/ProposalApprovalCard.test.tsx`
- Create: `src/app/agent/AgentAuditTrail.tsx`
- Create: `src/app/agent/AgentAuditTrail.test.tsx`
- Modify: `src/webmcp/tools.ts`
- Modify: `src/webmcp/tools.test.ts`
- Modify: `src/app/AppShell.tsx`
- Modify: `src/app/AppHeader.tsx`
- Modify: `src/app/App.integration.test.tsx`
- Modify: `src/app/accessibility.test.tsx`
- Modify: `src/styles.css`

1. Write failing tool tests for `get_active_context`. The result must identify the simulated actor, policy revision, permitted tool names, current state revision, pending proposal summaries, and a clear simulation disclaimer.
2. Remove `get_app_status` from the active agent catalog and add `get_active_context`. Derive exposed tool registration solely from `policyForSession`, not from a UI mode string.
3. Ensure all registered mutating tools use proposal/execute schemas. Keep only the active actor's tool set registered after a session switch.
4. Build `ProposalApprovalCard`: state proposed effect and warnings in plain language, display expiry/status, and offer keyboard-accessible Approve and Decline controls. Approve invokes guarded execution; decline records an audit event and does not mutate domain data.
5. Build `AgentAuditTrail`: chronological, readable audit rows showing actor, event type, timestamp, outcome, and redacted summary. Keep it a semantic list with accessible labels.
6. Update the header to name the active simulated actor and policy revision. Integrate pending approvals/audit into employee and employer shells using existing Jem tokens and responsive layouts.
7. Add integration tests for actor switch -> context discovery -> proposal -> UI approval -> mutation -> audit entry; add accessibility tests for card buttons, audit list semantics, and focus visibility.
8. Run `npm test -- src/webmcp/tools.test.ts src/app/App.integration.test.tsx src/app/accessibility.test.tsx src/app/agent` and make the tests pass.
9. Commit:

```bash
git add src/app/agent src/webmcp/tools.ts src/webmcp/tools.test.ts src/app/AppShell.tsx src/app/AppHeader.tsx src/app/App.integration.test.tsx src/app/accessibility.test.tsx src/styles.css
git commit -m "feat: surface agent context approvals and audit trail"
```

### Task 7: Refresh documentation and run the full adversarial regression suite

**Files:**
- Modify: `README.md`
- Modify: `docs/challenge-demo-script.md`
- Modify: `src/demo/privacy.test.ts`
- Modify: `src/app/App.test.tsx`

1. Update README architecture and tool examples to describe the simulated actor policy, `get_active_context`, proposal/execute workflow, honest shift-to-goal intent, and audit event model. Remove all references to `confirm: true`.
2. Update the demo script to show a safe employee flow and a safe employer flow, including explicit approval and a policy denial scenario.
3. Add privacy and app tests that assert employer context, validation output, and audit trail never expose raw employee compensation, expenses, goals, or free-form proposal input.
4. Run a repository search and eliminate stale confirmation APIs:

```bash
rg -n "confirm:|confirm\b|get_app_status" src README.md docs
```

5. Run formatting, static checks, unit/integration/accessibility tests, production build, and the change review:

```bash
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
git diff --check main...HEAD
git status --short
```

6. Commit the docs and regression tests:

```bash
git add README.md docs/challenge-demo-script.md src/demo/privacy.test.ts src/app/App.test.tsx
git commit -m "docs: explain policy-aware WebMCP collaboration"
```

## Final acceptance checklist

- A tool can discover active simulated actor, policy revision, permitted tools, state revision, and pending proposals from `get_active_context`.
- The caller cannot execute savings-goal, shift, reward-allocation, or opportunity-draft changes without a matching approved proposal.
- Actor change, policy revision mismatch, stale state, wrong input, expiry, unknown proposal, and repeat execution all return explicit recoverable failures with no mutation.
- `prepare_shift_to_goal_plan` does not claim that unearned funds have moved or auto-transfer future rewards.
- Employer validation returns deterministic aggregate recommendations and keeps employee data private.
- Users can understand, approve, decline, and audit agent actions from the UI with keyboard support.
- `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` pass.
