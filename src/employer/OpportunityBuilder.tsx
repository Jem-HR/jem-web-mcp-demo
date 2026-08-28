import { useState } from "react";

import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { StatusBadge } from "../components/StatusBadge";
import { formatCurrency, formatPercentage } from "../components/format";
import { useDemoCapabilities, useDemoSelector } from "../demo/DemoProvider";
import type { CreateOpportunityDraftInput } from "../demo/employer-capabilities";
import type { OpportunityDraft, OpportunityValidation } from "../demo/types";

type DraftValues = Omit<CreateOpportunityDraftInput, "confirm">;

interface DraftPreview {
  input: DraftValues;
  draft: OpportunityDraft;
  summary: string;
}

const initialDraft: DraftValues = {
  type: "attendance",
  name: "October Reliability Reward",
  outcome: "Improve reliable attendance",
  eligibleSegment: "All active retail employees",
  qualificationRule: "Complete 5 published shifts without an unexcused absence",
  startDate: "2026-10-01",
  endDate: "2026-10-31",
  rewardType: "cash",
  rewardAmount: 250,
  totalBudget: 125000,
  maxPerEmployee: 250,
  exceptionPolicy:
    "Approved leave and employer schedule changes enter manager review",
};

const draftKeys: readonly (keyof DraftValues)[] = [
  "type",
  "name",
  "outcome",
  "eligibleSegment",
  "qualificationRule",
  "startDate",
  "endDate",
  "rewardType",
  "rewardAmount",
  "totalBudget",
  "maxPerEmployee",
  "exceptionPolicy",
];

function draftsMatch(left: DraftValues, right: DraftValues): boolean {
  return draftKeys.every((key) => left[key] === right[key]);
}

function readinessLabel(readiness: OpportunityValidation["readiness"]): string {
  return readiness === "review_required"
    ? "Review required"
    : `${readiness.charAt(0).toUpperCase()}${readiness.slice(1)}`;
}

function CheckLabel({
  passed,
  children,
}: {
  passed: boolean;
  children: string;
}) {
  return (
    <div>
      <dt>{children}</dt>
      <dd>
        <StatusBadge tone={passed ? "success" : "warning"}>
          {passed ? "Yes" : "No"}
        </StatusBadge>
      </dd>
    </div>
  );
}

function DraftPreviewCard({ preview }: { preview: DraftPreview }) {
  const { input } = preview;
  return (
    <Card
      aria-label="Draft preview"
      as="section"
      className="employer-card opportunity-preview"
      role="region"
    >
      <div className="employer-card__heading-row">
        <div>
          <p className="eyebrow">Exact preview snapshot</p>
          <h3>{input.name}</h3>
        </div>
        <StatusBadge tone="neutral">Draft</StatusBadge>
      </div>
      <p>{preview.summary}</p>
      <dl className="employer-details employer-details--wide">
        <div>
          <dt>Type</dt>
          <dd>{input.type}</dd>
        </div>
        <div>
          <dt>Outcome</dt>
          <dd>{input.outcome}</dd>
        </div>
        <div>
          <dt>Eligible segment</dt>
          <dd>{input.eligibleSegment}</dd>
        </div>
        <div>
          <dt>Qualification rule</dt>
          <dd>{input.qualificationRule}</dd>
        </div>
        <div>
          <dt>Dates</dt>
          <dd>
            {input.startDate} to {input.endDate}
          </dd>
        </div>
        <div>
          <dt>Reward</dt>
          <dd>
            {formatCurrency(input.rewardAmount)} {input.rewardType}
          </dd>
        </div>
        <div>
          <dt>Total budget</dt>
          <dd>{formatCurrency(input.totalBudget)}</dd>
        </div>
        <div>
          <dt>Maximum per employee</dt>
          <dd>{formatCurrency(input.maxPerEmployee)}</dd>
        </div>
        <div>
          <dt>Exception policy</dt>
          <dd>{input.exceptionPolicy}</dd>
        </div>
      </dl>
    </Card>
  );
}

function SavedDraftCard({ draft }: { draft: OpportunityDraft }) {
  return (
    <Card
      aria-label="Saved opportunity draft"
      as="section"
      className="employer-card opportunity-saved-draft"
      role="region"
    >
      <div className="employer-card__heading-row">
        <div>
          <p className="eyebrow">Saved draft</p>
          <h3>{draft.name}</h3>
        </div>
        <StatusBadge tone="neutral">Draft</StatusBadge>
      </div>
      <p>Saved programme draft. Validate its current rules and budget.</p>
      <dl className="employer-details employer-details--wide">
        <div>
          <dt>Type</dt>
          <dd>{draft.type}</dd>
        </div>
        <div>
          <dt>Outcome</dt>
          <dd>{draft.outcome}</dd>
        </div>
        <div>
          <dt>Eligible segment</dt>
          <dd>{draft.eligibleSegment}</dd>
        </div>
        <div>
          <dt>Qualification rule</dt>
          <dd>{draft.qualificationRule}</dd>
        </div>
        <div>
          <dt>Dates</dt>
          <dd>
            {draft.startDate} to {draft.endDate}
          </dd>
        </div>
        <div>
          <dt>Reward</dt>
          <dd>
            {formatCurrency(draft.rewardAmount)} {draft.rewardType}
          </dd>
        </div>
        <div>
          <dt>Total budget</dt>
          <dd>{formatCurrency(draft.totalBudget)}</dd>
        </div>
        <div>
          <dt>Maximum per employee</dt>
          <dd>{formatCurrency(draft.maxPerEmployee)}</dd>
        </div>
        <div>
          <dt>Exception policy</dt>
          <dd>{draft.exceptionPolicy}</dd>
        </div>
      </dl>
    </Card>
  );
}

export function OpportunityValidationCard({
  validation,
}: {
  validation: OpportunityValidation;
}) {
  return (
    <Card
      aria-label="Programme validation"
      as="section"
      className="employer-card opportunity-validation"
      role="region"
    >
      <div className="employer-card__heading-row">
        <div>
          <p className="eyebrow">Programme readiness</p>
          <h3>{readinessLabel(validation.readiness)}</h3>
        </div>
        <StatusBadge
          tone={validation.readiness === "ready" ? "success" : "warning"}
        >
          {validation.unresolvedExceptionCount} unresolved
        </StatusBadge>
      </div>
      <dl className="employer-details employer-details--wide">
        <CheckLabel passed={validation.rulesClear}>Rules clear</CheckLabel>
        <CheckLabel passed={validation.dataAvailable}>
          Data available
        </CheckLabel>
        <CheckLabel passed={validation.dataFresh}>Data fresh</CheckLabel>
        <CheckLabel passed={validation.fairnessPassed}>
          Fairness passed
        </CheckLabel>
        <CheckLabel passed={validation.budgetWithinLimit}>
          Budget within limit
        </CheckLabel>
        <div>
          <dt>Eligible employees</dt>
          <dd>{validation.eligibleEmployeeCount}</dd>
        </div>
        <div>
          <dt>Expected participation</dt>
          <dd>{formatPercentage(validation.expectedParticipationPercent)}</dd>
        </div>
        <div>
          <dt>Estimated cost</dt>
          <dd>{formatCurrency(validation.estimatedCost)}</dd>
        </div>
        <div>
          <dt>Maximum exposure</dt>
          <dd>{formatCurrency(validation.maximumExposure)}</dd>
        </div>
      </dl>
      <div className="opportunity-validation__issues">
        <h4>Unresolved issues</h4>
        <ul>
          {validation.issues.map((issue) => (
            <li key={issue}>{issue}</li>
          ))}
        </ul>
      </div>
    </Card>
  );
}

export function OpportunityBuilder() {
  const capabilities = useDemoCapabilities();
  const activeDraft = useDemoSelector((state) => state.employer.activeDraft);
  const validation = useDemoSelector((state) => state.employer.validation);
  const [draft, setDraft] = useState<DraftValues>(initialDraft);
  const [preview, setPreview] = useState<DraftPreview | null>(null);
  const [recoveryMessage, setRecoveryMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const canSave = preview !== null && draftsMatch(draft, preview.input);

  function updateDraft<Key extends keyof DraftValues>(
    key: Key,
    value: DraftValues[Key],
  ) {
    setDraft((current) => ({ ...current, [key]: value }));
    setPreview(null);
    setRecoveryMessage("");
    setSuccessMessage("");
  }

  function previewDraft() {
    setRecoveryMessage("");
    setSuccessMessage("");
    const snapshot = { ...draft };
    const result = capabilities.employer.createOpportunityDraft(
      { ...snapshot, confirm: false },
      "ui",
    );
    if (!result.ok) {
      setPreview(null);
      setRecoveryMessage(
        `We couldn’t preview this draft. ${result.error.recovery}`,
      );
      return;
    }
    setPreview({
      input: snapshot,
      draft: result.data,
      summary: result.summary,
    });
  }

  function saveDraft() {
    if (!preview || !draftsMatch(draft, preview.input)) return;
    setRecoveryMessage("");
    setSuccessMessage("");
    const result = capabilities.employer.createOpportunityDraft(
      { ...preview.input, confirm: true },
      "ui",
    );
    if (!result.ok) {
      setRecoveryMessage(
        `We couldn’t save this draft. ${result.error.recovery}`,
      );
      return;
    }
    setSuccessMessage("Draft saved. You can now validate the programme.");
  }

  function validateDraft() {
    if (activeDraft === null) return;
    setRecoveryMessage("");
    setSuccessMessage("");
    const result = capabilities.employer.validateOpportunity(
      { draftId: activeDraft.id },
      "ui",
    );
    if (!result.ok) {
      setRecoveryMessage(
        `We couldn’t validate this programme. ${result.error.recovery}`,
      );
      return;
    }
  }

  return (
    <div className="employer-panel opportunity-builder">
      <header className="employer-panel__header">
        <h2>Build an opportunity</h2>
        <p>Preview the exact rules and budget before saving the draft.</p>
      </header>
      <Card
        as="section"
        className="employer-card opportunity-builder__form-card"
      >
        <form
          className="feature-form"
          onSubmit={(event) => event.preventDefault()}
        >
          <div className="feature-form__fields feature-form__fields--two-columns">
            <label className="feature-form__field">
              <span>Opportunity type</span>
              <select
                onChange={(event) =>
                  updateDraft(
                    "type",
                    event.currentTarget.value as DraftValues["type"],
                  )
                }
                value={draft.type}
              >
                <option value="attendance">Attendance</option>
                <option value="learning">Learning</option>
                <option value="extra_shifts">Extra shifts</option>
              </select>
            </label>
            <label className="feature-form__field">
              <span>Opportunity name</span>
              <input
                onChange={(event) =>
                  updateDraft("name", event.currentTarget.value)
                }
                value={draft.name}
              />
            </label>
            <label className="feature-form__field feature-form__field--wide">
              <span>Outcome</span>
              <input
                onChange={(event) =>
                  updateDraft("outcome", event.currentTarget.value)
                }
                value={draft.outcome}
              />
            </label>
            <label className="feature-form__field feature-form__field--wide">
              <span>Eligible segment</span>
              <input
                onChange={(event) =>
                  updateDraft("eligibleSegment", event.currentTarget.value)
                }
                value={draft.eligibleSegment}
              />
            </label>
            <label className="feature-form__field feature-form__field--wide">
              <span>Qualification rule</span>
              <textarea
                onChange={(event) =>
                  updateDraft("qualificationRule", event.currentTarget.value)
                }
                rows={3}
                value={draft.qualificationRule}
              />
            </label>
            <label className="feature-form__field">
              <span>Start date</span>
              <input
                onChange={(event) =>
                  updateDraft("startDate", event.currentTarget.value)
                }
                type="date"
                value={draft.startDate}
              />
            </label>
            <label className="feature-form__field">
              <span>End date</span>
              <input
                onChange={(event) =>
                  updateDraft("endDate", event.currentTarget.value)
                }
                type="date"
                value={draft.endDate}
              />
            </label>
            <label className="feature-form__field">
              <span>Reward type</span>
              <select
                onChange={(event) =>
                  updateDraft(
                    "rewardType",
                    event.currentTarget.value as DraftValues["rewardType"],
                  )
                }
                value={draft.rewardType}
              >
                <option value="cash">Cash</option>
                <option value="voucher">Voucher</option>
                <option value="credits">Credits</option>
              </select>
            </label>
            <label className="feature-form__field">
              <span>Reward amount</span>
              <input
                min="1"
                onChange={(event) =>
                  updateDraft("rewardAmount", Number(event.currentTarget.value))
                }
                type="number"
                value={draft.rewardAmount}
              />
            </label>
            <label className="feature-form__field">
              <span>Total budget</span>
              <input
                min="1"
                onChange={(event) =>
                  updateDraft("totalBudget", Number(event.currentTarget.value))
                }
                type="number"
                value={draft.totalBudget}
              />
            </label>
            <label className="feature-form__field">
              <span>Maximum per employee</span>
              <input
                min="1"
                onChange={(event) =>
                  updateDraft(
                    "maxPerEmployee",
                    Number(event.currentTarget.value),
                  )
                }
                type="number"
                value={draft.maxPerEmployee}
              />
            </label>
            <label className="feature-form__field feature-form__field--wide">
              <span>Exception policy</span>
              <textarea
                onChange={(event) =>
                  updateDraft("exceptionPolicy", event.currentTarget.value)
                }
                rows={3}
                value={draft.exceptionPolicy}
              />
            </label>
          </div>
          <div className="feature-form__actions">
            <Button onClick={previewDraft}>Preview draft</Button>
            <Button disabled={!canSave} onClick={saveDraft} variant="secondary">
              Save draft
            </Button>
            <Button
              disabled={activeDraft === null}
              onClick={validateDraft}
              variant="navy"
            >
              Validate programme
            </Button>
          </div>
        </form>
      </Card>
      {recoveryMessage ? (
        <p className="recovery-message" role="alert">
          {recoveryMessage}
        </p>
      ) : null}
      {successMessage ? (
        <p className="success-message" role="status">
          {successMessage}
        </p>
      ) : null}
      {preview ? <DraftPreviewCard preview={preview} /> : null}
      {activeDraft ? <SavedDraftCard draft={activeDraft} /> : null}
      {validation ? (
        <OpportunityValidationCard validation={validation} />
      ) : null}
    </div>
  );
}
