import { useState } from "react";

import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Dialog } from "../components/Dialog";
import { StatusBadge, type StatusTone } from "../components/StatusBadge";
import { useDemoCapabilities, useDemoSelector } from "../demo/DemoProvider";
import type { RewardAllocationResult } from "../demo/employee-capabilities";
import type { Reward, RewardDestination } from "../demo/types";
import {
  destinationLabel,
  formatEmployeeCurrency,
  formatEmployeeDate,
} from "./employee-display";

interface RewardConfirmation {
  rewardId: string;
  destination: RewardDestination;
  preview: RewardAllocationResult;
  summary: string;
}

function confirmationsMatch(
  displayed: RewardConfirmation,
  refreshed: RewardConfirmation,
): boolean {
  return (
    displayed.rewardId === refreshed.rewardId &&
    displayed.destination === refreshed.destination &&
    displayed.summary === refreshed.summary &&
    displayed.preview.rewardId === refreshed.preview.rewardId &&
    displayed.preview.destination === refreshed.preview.destination &&
    displayed.preview.amount === refreshed.preview.amount &&
    displayed.preview.goalSavedAmount === refreshed.preview.goalSavedAmount
  );
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
  const [activeRewardId, setActiveRewardId] = useState<string | null>(null);
  const [destination, setDestination] = useState<RewardDestination>("savings");
  const [recoveryMessage, setRecoveryMessage] = useState("");
  const [noticeMessage, setNoticeMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const selectedReward = activeRewardId
    ? (rewards.find((reward) => reward.id === activeRewardId) ?? null)
    : null;

  function closeConfirmation() {
    setActiveRewardId(null);
    setConfirmation(null);
    setRecoveryMessage("");
    setNoticeMessage("");
  }

  function allocateReward(reward: Reward) {
    setActiveRewardId(null);
    setConfirmation(null);
    setDestination("savings");
    setRecoveryMessage("");
    setNoticeMessage("");
    setSuccessMessage("");
    const result = capabilities.employee.allocateReward(
      { rewardId: reward.id, destination: "savings", confirm: false },
      "ui",
    );
    if (!result.ok) {
      setRecoveryMessage(`${result.error.message} ${result.error.recovery}`);
      return;
    }
    setActiveRewardId(reward.id);
    setConfirmation({
      rewardId: reward.id,
      destination: result.data.destination,
      preview: result.data,
      summary: result.summary,
    });
  }

  function selectDestination(nextDestination: RewardDestination) {
    setDestination(nextDestination);
    if (!activeRewardId) return;

    setConfirmation(null);
    setRecoveryMessage("");
    setNoticeMessage("");
    const result = capabilities.employee.allocateReward(
      {
        rewardId: activeRewardId,
        destination: nextDestination,
        confirm: false,
      },
      "ui",
    );
    if (!result.ok) {
      setRecoveryMessage(`${result.error.message} ${result.error.recovery}`);
      return;
    }
    setRecoveryMessage("");
    setConfirmation({
      rewardId: activeRewardId,
      destination: result.data.destination,
      preview: result.data,
      summary: result.summary,
    });
  }

  function confirmAllocation() {
    if (!confirmation || confirmation.destination !== destination) return;
    const displayedConfirmation = confirmation;
    setConfirmation(null);
    setRecoveryMessage("");
    setNoticeMessage("");

    const refreshedResult = capabilities.employee.allocateReward(
      {
        rewardId: displayedConfirmation.rewardId,
        destination,
        confirm: false,
      },
      "ui",
    );
    if (!refreshedResult.ok) {
      setRecoveryMessage(
        `${refreshedResult.error.message} ${refreshedResult.error.recovery}`,
      );
      return;
    }
    const refreshedConfirmation: RewardConfirmation = {
      rewardId: displayedConfirmation.rewardId,
      destination: refreshedResult.data.destination,
      preview: refreshedResult.data,
      summary: refreshedResult.summary,
    };
    if (!confirmationsMatch(displayedConfirmation, refreshedConfirmation)) {
      setConfirmation(refreshedConfirmation);
      setNoticeMessage(
        "Your balance changed. Review the updated allocation before confirming.",
      );
      return;
    }

    const result = capabilities.employee.allocateReward(
      {
        rewardId: refreshedConfirmation.rewardId,
        destination: refreshedConfirmation.destination,
        confirm: true,
      },
      "ui",
    );
    if (!result.ok) {
      setRecoveryMessage(`${result.error.message} ${result.error.recovery}`);
      return;
    }
    setSuccessMessage(
      `${formatEmployeeCurrency(result.data.amount)} added to ${destinationLabel(refreshedConfirmation.destination)}`,
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
      {recoveryMessage && selectedReward === null ? (
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
            <Button
              disabled={
                confirmation === null ||
                confirmation.destination !== destination
              }
              onClick={confirmAllocation}
            >
              Confirm allocation
            </Button>
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
        {selectedReward ? (
          <div className="confirmation-preview">
            {confirmation ? (
              <>
                <p>{confirmation.summary}</p>
                <p>
                  {formatEmployeeCurrency(selectedReward.amount)}{" "}
                  {selectedReward.rewardType}
                </p>
                <p>
                  Preview destination:{" "}
                  {destinationLabel(confirmation.destination)}
                </p>
                <p>
                  Goal savings after allocation:{" "}
                  {formatEmployeeCurrency(confirmation.preview.goalSavedAmount)}
                </p>
              </>
            ) : null}
            <fieldset className="reward-destinations">
              <legend>Choose a destination</legend>
              <label>
                <input
                  checked={destination === "savings"}
                  name="reward-destination"
                  onChange={() => selectDestination("savings")}
                  type="radio"
                />
                Add to Jem Savings
              </label>
              <label>
                <input
                  checked={destination === "voucher"}
                  name="reward-destination"
                  onChange={() => selectDestination("voucher")}
                  type="radio"
                />
                Choose a voucher
              </label>
            </fieldset>
            {noticeMessage ? (
              <p className="confirmation-notice" role="status">
                {noticeMessage}
              </p>
            ) : null}
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
