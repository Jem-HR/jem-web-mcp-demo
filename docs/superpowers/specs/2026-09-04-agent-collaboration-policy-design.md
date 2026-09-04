# Jem Unlocked Agent Collaboration Policy Design

## Purpose

Turn Jem Unlocked from a set of well-tested WebMCP actions into a truthful,
inspectable collaboration model: agents may propose work, people approve it in
the interface, and only the exact approved proposal can change demo state.

The prototype remains client-only and uses fixed illustrative data. It does not
claim production authentication or server-enforced authorisation. Its explicit
simulated actor policy is an adapter boundary for a future authenticated
session.

## Goals

- Require a proposal, visible human approval, and exact guarded execution for
  consequential WebMCP actions.
- Separate presentation from actor policy: Employee and Employer Hub are views
  of an explicit simulated session, not the source of authorisation rules.
- Make tool registration, data scope, and action authority discoverable to an
  agent and visible to a person.
- Add one truthful compound employee workflow: a shift request can create a
  savings intent, but never moves unearned wages.
- Upgrade employer validation into explainable aggregate decision support.
- Show a compact, accessible audit trail of agent proposals, approvals,
  executions, rejections, and policy denials.
- Add adversarial tests for direct execution, replay, changed input, stale
  state, cross-actor access, and retained stale tools.

## Non-goals

- Real login, server sessions, persistent storage, payroll, scheduling, or
  financial transfers.
- A claim that client-side role switching protects data from an adversarial
  user. The prototype will describe it as simulated policy scope.
- Automatic programme launch, shift assignment, reward issuance, or fairness
  resolution.
- A generic chat interface or an additional model provider.

## Architecture

```text
Simulated actor session
  -> capability policy
     -> view and registered tool surface
        -> action proposal
           -> UI approval or rejection
              -> guarded capability execution
                 -> visible audit event
```

### Actor session and policy

`ActorSession` holds an actor ID (`employee` or `employer`), display identity,
policy revision, and active policy scope. `CapabilityPolicy` owns the exposed
tool names, protected data classes, and whether a tool is consequential.

The existing UI mode becomes a view of the current actor session. Switching the
demo actor creates a new policy revision and invalidates pending proposals. The
application header will call this a simulated session switch, with plain
language explaining that production identity belongs on a server.

Tool registration receives `CapabilityPolicy`, rather than a bare presentation
mode. Employer registration remains projection-safe; employee-private tools are
not registered in Employer scope. A common `get_active_context` tool reports
the actor, policy scope, active tool names, protected data classes, state
revision, and how a person can change scope.

### Proposals and approval

All consequential operations use `ActionProposal` records. A proposal contains:

- opaque ID and action name;
- actor ID and policy revision;
- canonical input fingerprint;
- state revision at preview time;
- created and expiry timestamps expressed in deterministic demo sequence;
- warnings, expected visible effects, and redacted summary;
- status: `pending`, `approved`, `rejected`, `executed`, `expired`, or
  `invalidated`.

Tool previews create one pending proposal and return its approval ID. A tool may
execute only when it receives that ID and the matching payload after the UI has
approved it. A direct execution without an approved proposal returns
`CONFIRMATION_REQUIRED`; altered input returns `PROPOSAL_MISMATCH`; changed
actor/policy/state returns `STALE_PROPOSAL`; replay returns `ALREADY_EXECUTED`.

The UI renders pending proposals in a named region with the exact impact and
Approve / Reject controls. Approval and rejection are user-interface events;
execution remains attributable to the WebMCP agent. Existing UI actions may
continue to use a dedicated direct UI path, but must create matching audit
events when consequential.

### Compound shift-to-goal intent

`prepare_shift_to_goal_plan` is an employee-scope consequential tool. It
accepts an eligible shift ID and goal ID, then returns a proposal showing shift
details, estimated earnings before deductions, current goal progress, and a
plain-language projection.

Approval records the shift request and a `SavingsIntent` stating that the
employee wants verified future earnings considered for the selected goal. It
does not increase the saved amount, promise an assignment, or allocate wages.
An earned reward remains the only current demo mechanism that changes savings.

### Employer scenario analysis

`validate_opportunity` retains its no-confirmation, aggregate-only analysis.
Its result grows a `recommendations` list with safe alternatives derived from
the submitted draft: reduce maximum exposure, increase budget, or resolve data
and fairness reviews. Results state the current policy scope and never return
employee financial fields.

### Audit trail

`AgentAuditEvent` records a monotonic ID, actor, source, action, proposal ID
when relevant, outcome, policy/state revisions, a redacted human summary, and
the deterministic timestamp. The employee and employer experiences show the
same most-recent policy-relevant events appropriate to their scope. The global
live region continues to announce applied and policy-denied actions.

The interface uses existing Jem patterns: cream surfaces, navy structure,
Jem-pink primary approval action, plain South African English, and named status
text that does not depend on colour. Audit content remains compact and does not
imitate a technical security console.

## Error handling

Tool errors are structured and redacted. New codes are:

- `CONFIRMATION_REQUIRED` — no approved proposal exists;
- `PROPOSAL_MISMATCH` — execution payload does not match the preview;
- `STALE_PROPOSAL` — policy actor, policy revision, state revision, or expiry
  is no longer valid;
- `ALREADY_EXECUTED` — proposal was consumed;
- `POLICY_DENIED` — requested capability is outside the actor policy.

Errors give an agent one recovery path: inspect active context, create a fresh
proposal, or ask a person to approve/reject it. They never expose untrusted
input or employee-private data.

## Testing and acceptance criteria

Tests must prove:

1. Employee and employer policies expose only their appropriate tools, and a
   policy switch aborts old registration.
2. `get_active_context` reports scoped tools and protected data without private
   values.
3. Each consequential WebMCP action creates a pending proposal; direct execute
   fails; UI approval enables only the exact current proposal; execution is
   one-time.
4. Input changes, state changes, actor changes, expiry, and stale retained tool
   references fail without mutation and leave an audit event.
5. The shift-to-goal plan records a request plus savings intent but never moves
   money or claims an assignment.
6. Employer scenarios produce draft-derived aggregate recommendations while
   retaining privacy boundaries.
7. Audit UI is accessible, responsive, announced, and redacts employee-private
   data in employer scope.
8. Existing preview, privacy, accessibility, reducer, and WebMCP registration
   coverage continues to pass.

## Demo narrative

The judge-facing story becomes: the page exposes only the agent capabilities
appropriate to the person currently represented; the agent proposes a concrete
action; the person approves it in the product; the agent executes exactly that
approval; the visible audit trail explains what happened and why it was safe.

The headline claim is deliberately limited: this is a client-only simulation
of policy-aware agent collaboration, with a production-ready separation between
policy, data projection, and execution.
