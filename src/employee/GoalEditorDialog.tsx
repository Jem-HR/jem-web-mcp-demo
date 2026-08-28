import { useState } from "react";

import { Button } from "../components/Button";
import { Dialog } from "../components/Dialog";
import { Tabs, type TabDefinition } from "../components/Tabs";
import { useDemoCapabilities, useDemoSelector } from "../demo/DemoProvider";
import type { DemoCapabilities } from "../demo/capabilities";
import type { ExpenseKey, ExpenseMap, Goal } from "../demo/types";

const expenseFields: readonly { key: ExpenseKey; label: string }[] = [
  { key: "housing", label: "Housing" },
  { key: "transport", label: "Transport" },
  { key: "food", label: "Food" },
  { key: "dependants", label: "Dependants" },
  { key: "debt", label: "Debt repayments" },
  { key: "airtime", label: "Airtime and data" },
  { key: "other", label: "Other" },
];

const goalChoices = [
  { name: "Emergency Fund", emoji: "🏦" },
  { name: "School Fees", emoji: "🎓" },
  { name: "Buy a Phone", emoji: "📱" },
  { name: "Pay Down Debt", emoji: "💳" },
  { name: "Transport Savings", emoji: "🚌" },
  { name: "December Expenses", emoji: "🎄" },
  { name: "My Own Goal", emoji: "✨" },
] as const;

export interface GoalEditorDialogProps {
  open: boolean;
  onClose(): void;
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

function GoalForm({
  capabilities,
  goal,
  onClose,
}: {
  capabilities: DemoCapabilities;
  goal: Goal;
  onClose(): void;
}) {
  const [draft, setDraft] = useState({ ...goal });
  const [recoveryMessage, setRecoveryMessage] = useState("");

  function saveGoal() {
    const result = capabilities.employee.updateSavingsGoal(
      { ...draft, confirm: true },
      "ui",
    );
    if (!result.ok) {
      setRecoveryMessage(result.error.recovery);
      return;
    }
    onClose();
  }

  return (
    <form
      className="feature-form"
      onSubmit={(event) => {
        event.preventDefault();
        saveGoal();
      }}
    >
      <div aria-label="Goal choices" className="goal-choices">
        {goalChoices.map((choice) => (
          <Button
            aria-pressed={
              draft.name === choice.name && draft.emoji === choice.emoji
            }
            key={choice.name}
            onClick={() => setDraft({ ...draft, ...choice })}
            variant="secondary"
          >
            <span aria-hidden="true">{choice.emoji}</span> {choice.name}
          </Button>
        ))}
      </div>
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
      {recoveryMessage ? <p role="alert">{recoveryMessage}</p> : null}
      <div className="feature-form__actions feature-form__actions--end">
        <Button type="submit">Save changes</Button>
      </div>
    </form>
  );
}

function ExpenseForm({
  capabilities,
  expenses,
  onClose,
}: {
  capabilities: DemoCapabilities;
  expenses: ExpenseMap;
  onClose(): void;
}) {
  const [draft, setDraft] = useState(expenses);
  const [recoveryMessage, setRecoveryMessage] = useState("");

  function saveExpenses() {
    const result = capabilities.employee.updateExpenses(draft, "ui");
    if (!result.ok) {
      setRecoveryMessage(result.error.recovery);
      return;
    }
    onClose();
  }

  return (
    <form
      className="feature-form"
      onSubmit={(event) => {
        event.preventDefault();
        saveExpenses();
      }}
    >
      <p className="feature-form__description">
        These monthly expense details remain private to you.
      </p>
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
      {recoveryMessage ? <p role="alert">{recoveryMessage}</p> : null}
      <div className="feature-form__actions feature-form__actions--end">
        <Button type="submit">Save changes</Button>
      </div>
    </form>
  );
}

function editorTabs(
  goal: Goal,
  expenses: ExpenseMap,
  capabilities: DemoCapabilities,
  onClose: () => void,
): TabDefinition[] {
  return [
    {
      id: "goal",
      label: "Goal",
      panel: (
        <GoalForm capabilities={capabilities} goal={goal} onClose={onClose} />
      ),
    },
    {
      id: "expenses",
      label: "Expenses",
      panel: (
        <ExpenseForm
          capabilities={capabilities}
          expenses={expenses}
          onClose={onClose}
        />
      ),
    },
  ];
}

export function GoalEditorDialog({ open, onClose }: GoalEditorDialogProps) {
  const capabilities = useDemoCapabilities();
  const goal = useDemoSelector((state) => state.employee.goal);
  const expenses = useDemoSelector((state) => state.employee.expenses);
  const [selectedTab, setSelectedTab] = useState("goal");

  return (
    <Dialog open={open} title="Edit my details" onClose={onClose}>
      <Tabs
        ariaLabel="Employee financial details"
        onSelect={setSelectedTab}
        selectedId={selectedTab}
        tabs={editorTabs(goal, expenses, capabilities, onClose)}
      />
    </Dialog>
  );
}
