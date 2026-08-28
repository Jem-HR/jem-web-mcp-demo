# Jem Unlocked challenge demo script

Use this deterministic six-beat story in ChatGPT’s in-app Browser or Chrome with `chrome://flags/#enable-webmcp-testing` enabled. Start with a page refresh for the known completed Nomsa dashboard. If the session has changed, use **Reset demo** instead: it restores fixtures and opens onboarding step 1, so complete onboarding before starting this script. Nothing persists after refresh.

For every consequential tool, first show the `confirm: false` preview, ask the user for an explicit confirmation, and make the identical call with `confirm: true` only after they agree. Each confirmed action updates the UI and sends a persistent screen-reader announcement through the global activity region.

## 1. Read Nomsa’s dashboard

Open the default employee view and call:

```javascript
get_employee_dashboard({});
```

Point out the **School Fees** goal, R2,520 saved, next payday, confirmed shifts, and four employee tabs. Explain that the dashboard is private to the employee journey; its exact expenses are not returned.

## 2. List opportunities and request a shift

Open **Shifts**, then call:

```javascript
list_employee_opportunities({ category: "shift" });
request_shift({ shiftId: "shift-sat-rosebank", confirm: false });
```

Show the preview for the Rosebank Mall shift on 5 September 2026, with estimated earnings before deductions. Ask: “Would you like me to record this shift request?” After an explicit yes, call:

```javascript
request_shift({ shiftId: "shift-sat-rosebank", confirm: true });
```

Point out that the shift becomes **Requested**. The global activity region announces the change to screen-reader users. It is a request, not a shift assignment.

## 3. Allocate an earned reward

Open **Rewards** and use the earned August Safety Award:

```javascript
allocate_reward({
  rewardId: "reward-safety",
  destination: "savings",
  confirm: false,
});
```

Show the R150 preview and ask: “Would you like me to allocate this earned reward to Nomsa’s savings goal?” After explicit confirmation, call:

```javascript
allocate_reward({
  rewardId: "reward-safety",
  destination: "savings",
  confirm: true,
});
```

Return to **Overview**. Point out the R2,670 goal total, 45% savings progress, and the visible **Recent activity** card. The global activity region also announces the allocation to screen-reader users. This is demo state only; it does not issue a reward or move money.

## 4. Switch to employer metrics

Use the header’s **Employer Hub** control, then call:

```javascript
get_employer_dashboard({});
list_programmes({ status: "all" });
```

Point out aggregate workforce, programme, budget, and data-confidence metrics. Contrast this with the employee view: no goal, savings amount, target, contribution, privacy choice, or expenses are available to employer tools.

## 5. Draft and validate a programme

Open **Create Opportunity**. First prepare the valid October draft without changing state:

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

Show the preview and ask: “Would you like me to save this October programme draft for review?” After explicit confirmation, call:

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
  confirm: true,
});
```

Then validate the saved draft:

```javascript
validate_opportunity({ draftId: "draft-opportunity" });
```

Point out the saved draft, validation result, and review-required fairness state. Validation changes local analysis only; it does not need confirmation and cannot approve or launch a programme.

## 6. Inspect unresolved fairness exceptions

Open **Fairness & Data** and call:

```javascript
list_fairness_exceptions({ severity: "all" });
```

Point out the three open exceptions and their anonymised initial-plus-surname labels. Explain that these labels are illustrative pseudonyms, not a production anonymity guarantee. The prototype can inspect exceptions but cannot resolve them.

## Recovery and reset

If a call is declined, leave the preview unapplied and continue with another read operation. If the state no longer matches the script, refresh for the known completed employee landing state, or select **Reset demo**, complete onboarding, and begin again. Do not present a preview as an applied action.
