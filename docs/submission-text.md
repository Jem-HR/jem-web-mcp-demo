# Devpost submission text

Copy the sections below into the Devpost form. Written to answer the four
required prompts in order, and to give each judging criterion something
concrete to score.

---

## Tagline

An agent that can act for a frontline worker without ever seeing what she is
saving for.

---

## Inspiration / the problem

Jem is a real HR and financial wellbeing platform used by South African
frontline workers — retail assistants, security officers, cleaners — and by the
employers who roster and pay them. These are people who do not sit at a desk,
often share a phone, and use the product in the ten minutes between shifts.

For that user, the distance between an intention and the action is where
engagement dies. "I want to pick up Saturday's shift and put the extra towards
my daughter's school fees" is one sentence for a person and six screens for an
app. Most of our users never finish the six screens.

The obvious fix is an agent. The reason it has not happened is trust: the
moment an agent can act on a worker's money, you have to answer two questions
that a chatbot bolted onto a website cannot answer. What exactly can it do?
And what can the _employer's_ agent see about the worker?

## Why this is a strong fit for WebMCP

WebMCP lets the page itself answer both questions, because the page is the
thing that actually knows.

A server-side agent integration sees a copy of the domain. A DOM-scraping agent
sees pixels and guesses. A WebMCP page exposes the _same capability layer the
UI is built on_, so there is exactly one definition of what an action means —
and the page author, not the model, decides which capabilities exist at all.

Three properties fall out of that, and all three matter more for financial
software than for a shopping demo:

**The privacy boundary is code, not a prompt.** Jem Unlocked is one app serving
two people with opposed information rights. Nomsa is saving for school fees.
Sipho runs workforce programmes at her employer. Employer tools are wired to a
capability layer that structurally cannot produce a private employee field —
goal, saved amount, target, monthly contribution, privacy choice or expenses.
No system prompt is asking the model to behave. We hold that boundary with
privacy sentinel tests that assert every employer tool and DTO against the
private field set, so the build fails if someone widens a projection.

**Consequential actions are gated by the page.** Every money-adjacent tool takes
a required `confirm` boolean. `confirm: false` returns a preview and mutates
nothing; only an identical call with `confirm: true` applies it. The agent
cannot skip the preview, because the preview _is_ the tool. An ambiguous
instruction cannot move a worker's savings.

**Exposure is a deliberate decision.** `update_expenses` exists in the UI and is
intentionally _not_ exposed as a tool. A worker's itemised expenses are the most
sensitive thing in the app, and the correct number of agents that can edit them
is zero. Showing a capability we chose not to expose says more about the design
than another tool would.

## How it creates a better user experience

The agent's work lands in the interface, in real time. Tool handlers and React
event handlers call the same capability layer, so there is no parallel agent
code path that can drift from what the human sees. Confirm a reward allocation
in the conversation and the goal ring on the page moves to 45%, the Recent
activity card gains a row, and the totals update — the human is watching, not
taking the agent's word for it.

That shared layer also gave us something we did not expect to be able to do:
**every agent-driven change is announced to screen readers** through a global
activity region. If an agent acts on your behalf, you should not have to be
sighted to know what it did. For a workforce with wide variation in digital
fluency and device quality, "you can always see and hear what just happened" is
the difference between a useful agent and a scary one.

The app is also progressive enhancement — without `document.modelContext` it
renders as a complete, usable product. The agent is an accelerator, never a
dependency.

## What people and agents can do together that was difficult before

- **"Find me a shift this weekend and put the earnings towards school fees."**
  The agent lists real open shifts, previews the shift request _and_ the goal
  impact, and applies both only after Nomsa says yes. Previously: two separate
  journeys across two tabs, with the arithmetic left to the worker.
- **"Am I on track?"** The agent reads live dashboard state — not a stale export
  or a scraped screenshot.
- **"Who is being under-offered shifts?"** Sipho's agent reads anonymised
  fairness exceptions and drafts a programme against them, while remaining
  unable to retrieve any individual's private financial data. Two agents, one
  codebase, asymmetric access — enforced structurally.
- **Draft, then validate, then stop.** `create_opportunity_draft` saves a draft
  and `validate_opportunity` analyses it, but nothing in the tool surface can
  launch a programme or move money. The agent takes the work to the point of a
  human decision and hands it back.

## How we implemented WebMCP

Twelve tools registered through `document.modelContext.registerTool`, each with:

- a **closed input schema** (`additionalProperties: false`) plus a runtime
  validator mirroring that schema, so a malformed agent call returns a
  structured `INVALID_INPUT` result instead of throwing
- `annotations.readOnlyHint` distinguishing the seven pure readers from the five
  tools that touch state
- registration under a shared `AbortSignal`, so an interrupted registration
  tears the whole set down rather than leaving a half-exposed surface
- results as structured `CapabilityResult` objects carrying a machine-readable
  error code and a recovery hint, so an agent can retry intelligently

Four consequential tools implement the preview/confirm contract:
`update_savings_goal`, `request_shift`, `allocate_reward`,
`create_opportunity_draft`.

The whole thing is React 19 + TypeScript with a deterministic in-memory store
and no backend, covered by 122 tests across 21 files, including the privacy
sentinels and accessibility tests.

## What it is not

A prototype, honestly scoped. Fixed illustrative data, pseudonymous names, no
real customer data, no persistence, no payroll or scheduling system behind it.
It demonstrates state changes but cannot assign a shift, launch a programme,
issue a reward or move money. The fairness labels are illustrative, not a
production anonymity guarantee.

The architecture, though, is the one we would ship: a capability layer shared
between the UI and the tool surface, with the privacy boundary enforced by
tests.
