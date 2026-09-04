import { useState, type ReactNode } from "react";

import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { formatCurrency } from "../components/format";
import {
  useDemoCapabilities,
  useDemoSelector,
  useDemoStore,
} from "../demo/DemoProvider";
import type { DemoCapabilities } from "../demo/capabilities";
import type { UpdateSavingsGoalInput } from "../demo/employee-capabilities";
import type {
  DemoState,
  DemoStore,
  ExpenseKey,
  ExpenseMap,
  Goal,
} from "../demo/types";

const goalChoices = [
  { name: "Emergency Fund", emoji: "🏦" },
  { name: "School Fees", emoji: "🎓" },
  { name: "Buy a Phone", emoji: "📱" },
  { name: "Pay Down Debt", emoji: "💳" },
  { name: "Transport Savings", emoji: "🚌" },
  { name: "December Expenses", emoji: "🎄" },
  { name: "My Own Goal", emoji: "✨" },
] as const;

const expenseFields: readonly { key: ExpenseKey; label: string }[] = [
  { key: "housing", label: "Housing" },
  { key: "transport", label: "Transport" },
  { key: "food", label: "Food" },
  { key: "dependants", label: "Dependants" },
  { key: "debt", label: "Debt repayments" },
  { key: "airtime", label: "Airtime and data" },
  { key: "other", label: "Other" },
];

interface OnboardingStepArgs {
  state: DemoState;
  store: DemoStore;
  goalDraft: Omit<UpdateSavingsGoalInput, "confirm">;
  setGoalDraft(draft: Omit<UpdateSavingsGoalInput, "confirm">): void;
  expenseDraft: ExpenseMap;
  setExpenseDraft(draft: ExpenseMap): void;
  confirmed: boolean;
  setConfirmed(confirmed: boolean): void;
  showHrQuery: boolean;
  setShowHrQuery(show: boolean): void;
}

interface CompleteOnboardingArgs {
  capabilities: DemoCapabilities;
  goalDraft: Omit<UpdateSavingsGoalInput, "confirm">;
  expenseDraft: ExpenseMap;
  setRecoveryMessage(message: string): void;
}

function toGoalInput(goal: Goal): Omit<UpdateSavingsGoalInput, "confirm"> {
  return { ...goal };
}

function moveToStep(store: DemoStore, step: 1 | 2 | 3 | 4) {
  store.dispatch({ type: "onboarding/set-step", step });
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange(value: number): void;
}) {
  return (
    <label className="feature-form__field">
      <span>{label}</span>
      <input
        min="0"
        onChange={(event) => onChange(Number(event.currentTarget.value))}
        type="number"
        value={value}
      />
    </label>
  );
}

function GoalFields({
  draft,
  setDraft,
}: {
  draft: Omit<UpdateSavingsGoalInput, "confirm">;
  setDraft(draft: Omit<UpdateSavingsGoalInput, "confirm">): void;
}) {
  return (
    <div className="feature-form__fields">
      <label className="feature-form__field">
        <span>Goal name</span>
        <input
          onChange={(event) =>
            setDraft({ ...draft, name: event.currentTarget.value })
          }
          value={draft.name}
        />
      </label>
      <NumberField
        label="Target amount"
        onChange={(targetAmount) => setDraft({ ...draft, targetAmount })}
        value={draft.targetAmount}
      />
      <NumberField
        label="Already saved"
        onChange={(savedAmount) => setDraft({ ...draft, savedAmount })}
        value={draft.savedAmount}
      />
      <label className="feature-form__field">
        <span>Target date</span>
        <input
          onChange={(event) =>
            setDraft({ ...draft, targetDate: event.currentTarget.value })
          }
          type="date"
          value={draft.targetDate}
        />
      </label>
      <NumberField
        label="Monthly contribution"
        onChange={(monthlyContribution) =>
          setDraft({ ...draft, monthlyContribution })
        }
        value={draft.monthlyContribution}
      />
      <label className="feature-form__check">
        <input
          checked={draft.isPrivate}
          onChange={(event) =>
            setDraft({ ...draft, isPrivate: event.currentTarget.checked })
          }
          type="checkbox"
        />
        Keep my goal private
      </label>
    </div>
  );
}

function ExpenseFields({
  draft,
  setDraft,
}: {
  draft: ExpenseMap;
  setDraft(draft: ExpenseMap): void;
}) {
  return (
    <div className="feature-form__fields feature-form__fields--two-columns">
      {expenseFields.map(({ key, label }) => (
        <NumberField
          key={key}
          label={label}
          onChange={(value) => setDraft({ ...draft, [key]: value })}
          value={draft[key]}
        />
      ))}
    </div>
  );
}

function renderOnboardingStep(args: OnboardingStepArgs): ReactNode {
  const { expenseDraft, goalDraft, state, store } = args;
  const { profile } = state.employee;

  switch (state.onboarding.step) {
    case 1:
      return (
        <>
          <div className="onboarding-flow__heading">
            <p className="eyebrow">Welcome to Jem</p>
            <h1 id="onboarding-title">Confirm your employment details</h1>
            <p>Check these details before setting up your money plan.</p>
          </div>
          <Card className="onboarding-flow__profile">
            <dl>
              <div>
                <dt>Employer</dt>
                <dd>{profile.employerName}</dd>
              </div>
              <div>
                <dt>Role</dt>
                <dd>{profile.role}</dd>
              </div>
              <div>
                <dt>Start date</dt>
                <dd>{profile.startDate}</dd>
              </div>
              <div>
                <dt>Hourly rate</dt>
                <dd>{formatCurrency(profile.hourlyRate)}</dd>
              </div>
              <div>
                <dt>Pay frequency</dt>
                <dd>Monthly</dd>
              </div>
              <div>
                <dt>Next payday</dt>
                <dd>{profile.nextPayday}</dd>
              </div>
            </dl>
          </Card>
          <div className="feature-form__actions">
            <Button
              aria-pressed={args.confirmed}
              onClick={() => args.setConfirmed(true)}
              variant={args.confirmed ? "navy" : "primary"}
            >
              Details are correct
            </Button>
            <Button
              onClick={() => args.setShowHrQuery(!args.showHrQuery)}
              variant="ghost"
            >
              Raise an HR query
            </Button>
          </div>
          {args.showHrQuery ? (
            <p className="onboarding-flow__hint" role="status">
              Contact your HR team to correct these employment details.
            </p>
          ) : null}
          <div className="feature-form__actions feature-form__actions--end">
            <Button
              disabled={!args.confirmed}
              onClick={() => moveToStep(store, 2)}
            >
              Continue
            </Button>
          </div>
        </>
      );
    case 2:
      return (
        <>
          <div className="onboarding-flow__heading">
            <p className="eyebrow">Your goal</p>
            <h1 id="onboarding-title">Set your goal</h1>
            <p>Choose a goal, then make it yours.</p>
          </div>
          <div aria-label="Goal choices" className="goal-choices">
            {goalChoices.map((choice) => (
              <Button
                aria-pressed={
                  goalDraft.name === choice.name &&
                  goalDraft.emoji === choice.emoji
                }
                key={choice.name}
                onClick={() => args.setGoalDraft({ ...goalDraft, ...choice })}
                variant="secondary"
              >
                <span aria-hidden="true">{choice.emoji}</span> {choice.name}
              </Button>
            ))}
          </div>
          <GoalFields draft={goalDraft} setDraft={args.setGoalDraft} />
          <div className="feature-form__actions">
            <Button onClick={() => moveToStep(store, 1)} variant="secondary">
              Back
            </Button>
            <Button onClick={() => moveToStep(store, 3)}>Continue</Button>
          </div>
        </>
      );
    case 3:
      return (
        <>
          <div className="onboarding-flow__heading">
            <p className="eyebrow">Your monthly budget</p>
            <h1 id="onboarding-title">Monthly expenses</h1>
            <p>
              Your exact expense details stay private and are only used for your
              plan.
            </p>
          </div>
          <ExpenseFields draft={expenseDraft} setDraft={args.setExpenseDraft} />
          <div className="feature-form__actions">
            <Button onClick={() => moveToStep(store, 2)} variant="secondary">
              Back
            </Button>
            <Button onClick={() => moveToStep(store, 4)}>Continue</Button>
          </div>
        </>
      );
    case 4: {
      const totalExpenses = Object.values(expenseDraft).reduce(
        (total, amount) => total + amount,
        0,
      );
      return (
        <>
          <div className="onboarding-flow__heading">
            <p className="eyebrow">Your plan</p>
            <h1 id="onboarding-title">Your plan is ready</h1>
            <p>Here is the plan you will see on your dashboard.</p>
          </div>
          <Card className="onboarding-flow__summary">
            <dl>
              <div>
                <dt>Selected goal</dt>
                <dd>
                  {goalDraft.emoji} {goalDraft.name}
                </dd>
              </div>
              <div>
                <dt>Monthly contribution</dt>
                <dd>{formatCurrency(goalDraft.monthlyContribution)}</dd>
              </div>
              <div>
                <dt>Total monthly expenses</dt>
                <dd>{formatCurrency(totalExpenses)}</dd>
              </div>
              <div>
                <dt>Estimated completion date</dt>
                <dd>{goalDraft.targetDate}</dd>
              </div>
            </dl>
          </Card>
          <div className="feature-form__actions">
            <Button onClick={() => moveToStep(store, 3)} variant="secondary">
              Back
            </Button>
          </div>
        </>
      );
    }
  }
}

function completeOnboarding({
  capabilities,
  expenseDraft,
  goalDraft,
  setRecoveryMessage,
}: CompleteOnboardingArgs): void {
  const result = capabilities.employee.completeOnboardingPlan(
    { goal: goalDraft, expenses: expenseDraft },
    "ui",
  );
  if (!result.ok) {
    setRecoveryMessage(result.error.recovery);
    return;
  }
}

export function OnboardingFlow() {
  const state = useDemoSelector((value) => value);
  const capabilities = useDemoCapabilities();
  const store = useDemoStore();
  const [goalDraft, setGoalDraft] = useState(toGoalInput(state.employee.goal));
  const [expenseDraft, setExpenseDraft] = useState(state.employee.expenses);
  const [confirmed, setConfirmed] = useState(false);
  const [showHrQuery, setShowHrQuery] = useState(false);
  const [recoveryMessage, setRecoveryMessage] = useState("");

  if (state.onboarding.completed) return null;

  return (
    <main aria-labelledby="onboarding-title" className="onboarding-flow">
      <p className="onboarding-flow__step">Step {state.onboarding.step} of 4</p>
      {renderOnboardingStep({
        state,
        store,
        goalDraft,
        setGoalDraft,
        expenseDraft,
        setExpenseDraft,
        confirmed,
        setConfirmed,
        showHrQuery,
        setShowHrQuery,
      })}
      {recoveryMessage ? <p role="alert">{recoveryMessage}</p> : null}
      {state.onboarding.step === 4 ? (
        <Button
          onClick={() =>
            completeOnboarding({
              capabilities,
              goalDraft,
              expenseDraft,
              setRecoveryMessage,
            })
          }
        >
          Open my dashboard
        </Button>
      ) : null}
    </main>
  );
}
