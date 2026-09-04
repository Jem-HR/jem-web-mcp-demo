# Jem Unlocked — WebMCP challenge demo script

**Duration:** about three minutes
**Demo URL:** `https://jem-hr.github.io/jem-web-mcp-demo/`

## Before recording

Open the deployed page in a WebMCP-capable browser surface, then open **Site tools** from the browser address bar. The employee page should expose six tools; switch to **Employer Hub** to expose the distinct employer tool set.

Refresh before recording so Nomsa's completed employee dashboard is visible. If the session changes, select **Reset demo**, complete onboarding, and start again.

For every consequential action, first run the `confirm: false` preview. Only use `confirm: true` after an explicit spoken confirmation.

## Opening

> Jem Unlocked shows how an agent can work with live workplace data without becoming a general-purpose chatbot. It can read the context already visible in the app, suggest consequential actions, and requires explicit confirmation before changing anything.

## 1. Employee context and privacy

Call:

```javascript
get_employee_dashboard({});
```

> This is Nomsa's private view: her School Fees goal, R2,520 saved, upcoming payday, and available opportunities. The agent can help her here—but these personal financial details do not become available in the employer workspace.

Point out the School Fees goal and the private employee dashboard.

## 2. A safe shift request

Call:

```javascript
list_employee_opportunities({ category: "shift" });
request_shift({
  shiftId: "shift-sat-rosebank",
  confirm: false,
});
```

> The agent has found a Saturday Rosebank shift and is showing the impact before doing anything. It asks: “Would you like me to record this shift request?”

After the user says yes, call:

```javascript
request_shift({
  shiftId: "shift-sat-rosebank",
  confirm: true,
});
```

> The UI now shows it as Requested. Importantly, this is a request—not a shift assignment—and the action is visibly recorded.

## 3. Allocate an earned reward

Prepare the allocation:

```javascript
allocate_reward({
  rewardId: "reward-safety",
  destination: "savings",
  confirm: false,
});
```

> Nomsa has an earned R150 safety reward. The agent can preview allocating it to her goal, but cannot move it without her approval.

After explicit approval, call:

```javascript
allocate_reward({
  rewardId: "reward-safety",
  destination: "savings",
  confirm: true,
});
```

> The School Fees savings total rises to R2,670. The app announces and records the change, while making clear this is demo state—not a real payroll transfer.

## 4. Switch context: employer tools are different

Click **Employer Hub**, then call:

```javascript
get_employer_dashboard({});
list_programmes({ status: "all" });
```

> Now the agent sees aggregate workforce, programme, budget, and data-confidence information. It cannot access Nomsa's savings goal, expenses, or private intent—the page registers only employer-safe tools in this view.

Point out the changed Site tools list to make tool scoping visible.

## 5. Draft, then validate a programme

Prepare a draft:

```javascript
create_opportunity_draft({
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
  exceptionPolicy: "Approved leave and employer roster changes enter review",
  confirm: false,
});
```

> Again, the agent creates a preview first. It cannot launch payroll or publish a programme.

After approval, repeat the call with `confirm: true`, then call:

```javascript
validate_opportunity({ draftId: "draft-opportunity" });
```

> Validation is advisory. It surfaces review and fairness considerations, but it cannot approve the programme or resolve exceptions.

## 6. Finish with fairness review

Call:

```javascript
list_fairness_exceptions({ severity: "all" });
```

> The agent can surface anonymised fairness exceptions for human review. Jem Unlocked demonstrates the core WebMCP promise: agents operate inside the app's real context, with constrained tools, scoped data, and visible human control.

## Recovery

If a confirmation is declined, leave the preview unapplied and continue with a read operation. If state no longer matches this script, refresh the page or use **Reset demo**, complete onboarding, and begin again.
