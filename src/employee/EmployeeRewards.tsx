import { useState } from "react";

import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Dialog } from "../components/Dialog";
import { StatusBadge, type StatusTone } from "../components/StatusBadge";
import { useDemoCapabilities, useDemoSelector } from "../demo/DemoProvider";
import type { Reward, RewardDestination } from "../demo/types";
import {
  destinationLabel,
  formatEmployeeCurrency,
  formatEmployeeDate,
} from "./employee-display";

interface RewardConfirmation {
  rewardId: string;
  summary: string;
}

function rewardTone(status: Reward["status"]): StatusTone {
  return status === "allocated"
    ? "success"
    : status === "earned"
      ? "info"
      : "warning";
}

function rewardStatus(status: Reward["status"]): string {
  return status === "in_progress"
    ? "In progress"
    : `${status.charAt(0).toUpperCase()}${status.slice(1)}`;
}

export function EmployeeRewards() {
  const rewards = useDemoSelector((state) => state.employee.rewards);
  const capabilities = useDemoCapabilities();
  const [confirmation, setConfirmation] = useState<RewardConfirmation | null>(
    null,
  );
  const [destination, setDestination] = useState<RewardDestination>("savings");
  const [recoveryMessage, setRecoveryMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const selectedReward = confirmation
    ? (rewards.find((reward) => reward.id === confirmation.rewardId) ?? null)
    : null;

  function closeConfirmation() {
    setConfirmation(null);
    setRecoveryMessage("");
  }

  function allocateReward(reward: Reward) {
    setDestination("savings");
    setRecoveryMessage("");
    setSuccessMessage("");
    const result = capabilities.employee.allocateReward(
      { rewardId: reward.id, destination: "savings", confirm: false },
      "ui",
    );
    if (!result.ok) {
      setRecoveryMessage(`${result.error.message} ${result.error.recovery}`);
      return;
    }
    setConfirmation({ rewardId: reward.id, summary: result.summary });
  }

  function confirmAllocation() {
    if (!confirmation) return;
    const result = capabilities.employee.allocateReward(
      { rewardId: confirmation.rewardId, destination, confirm: true },
      "ui",
    );
    if (!result.ok) {
      setRecoveryMessage(`${result.error.message} ${result.error.recovery}`);
      return;
    }
    setSuccessMessage(
      `${formatEmployeeCurrency(result.data.amount)} added to ${destinationLabel(destination)}`,
    );
    closeConfirmation();
  }

  return (
    <div className="employee-panel">
      <header className="employee-panel__header">
        <h2>Rewards</h2>
        <p>Track qualification and choose where an earned reward goes.</p>
      </header>
      {successMessage ? (
        <p className="success-message" role="status">
          {successMessage}
        </p>
      ) : null}
      {recoveryMessage && !confirmation ? (
        <p className="recovery-message" role="alert">
          {recoveryMessage}
        </p>
      ) : null}
      <div className="employee-card-grid">
        {rewards.map((reward) => (
          <Card className="employee-card" key={reward.id}>
            <div className="employee-card__heading-row">
              <div>
                <p className="eyebrow">{reward.rewardType} reward</p>
                <h3>{reward.title}</h3>
              </div>
              <StatusBadge tone={rewardTone(reward.status)}>
                {rewardStatus(reward.status)}
              </StatusBadge>
            </div>
            <p>{reward.description}</p>
            <p className="employee-card__lead">
              {formatEmployeeCurrency(reward.amount)} {reward.rewardType}
            </p>
            {reward.qualifying !== null && reward.required !== null ? (
              <p>
                Qualification progress: {reward.qualifying} of {reward.required}
              </p>
            ) : null}
            <p className="employee-card__muted">
              Deadline:{" "}
              {reward.deadline ? formatEmployeeDate(reward.deadline) : "None"}
            </p>
            {reward.status === "earned" && reward.allocatedTo === null ? (
              <Button
                aria-label={`Allocate ${reward.title}`}
                onClick={() => allocateReward(reward)}
              >
                Allocate reward
              </Button>
            ) : null}
          </Card>
        ))}
      </div>
      <Dialog
        footer={
          <>
            <Button onClick={closeConfirmation} variant="secondary">
              Cancel
            </Button>
            <Button onClick={confirmAllocation}>Confirm allocation</Button>
          </>
        }
        onClose={closeConfirmation}
        open={selectedReward !== null}
        title={
          selectedReward
            ? `Allocate ${selectedReward.title}`
            : "Allocate reward"
        }
      >
        {selectedReward && confirmation ? (
          <div className="confirmation-preview">
            <p>{confirmation.summary}</p>
            <p>
              {formatEmployeeCurrency(selectedReward.amount)}{" "}
              {selectedReward.rewardType}
            </p>
            <fieldset className="reward-destinations">
              <legend>Choose a destination</legend>
              <label>
                <input
                  checked={destination === "savings"}
                  name="reward-destination"
                  onChange={() => setDestination("savings")}
                  type="radio"
                />
                Add to Jem Savings
              </label>
              <label>
                <input
                  checked={destination === "voucher"}
                  name="reward-destination"
                  onChange={() => setDestination("voucher")}
                  type="radio"
                />
                Choose a voucher
              </label>
            </fieldset>
            {recoveryMessage ? (
              <p className="recovery-message" role="alert">
                {recoveryMessage}
              </p>
            ) : null}
          </div>
        ) : null}
      </Dialog>
    </div>
  );
}
