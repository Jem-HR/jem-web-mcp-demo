import { useState } from "react";

import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Dialog } from "../components/Dialog";
import { StatusBadge, type StatusTone } from "../components/StatusBadge";
import { useDemoCapabilities, useDemoSelector } from "../demo/DemoProvider";
import type { Shift } from "../demo/types";
import {
  estimateLabel,
  formatEmployeeCurrency,
  formatEmployeeDate,
  shiftRequestLabel,
} from "./employee-display";

interface ShiftConfirmation {
  shiftId: string;
  summary: string;
}

function statusTone(status: Shift["status"]): StatusTone {
  return status === "confirmed"
    ? "success"
    : status === "requested"
      ? "warning"
      : "info";
}

function statusLabel(status: Shift["status"]): string {
  return `${status.charAt(0).toUpperCase()}${status.slice(1)}`;
}

function ShiftCard({
  onRequest,
  shift,
}: {
  onRequest(shift: Shift): void;
  shift: Shift;
}) {
  return (
    <Card className="employee-card shift-card">
      <div className="employee-card__heading-row">
        <div>
          <p className="eyebrow">{formatEmployeeDate(shift.date)}</p>
          <h3>
            {shift.role} · {shift.site}
          </h3>
        </div>
        <StatusBadge tone={statusTone(shift.status)}>
          {statusLabel(shift.status)}
        </StatusBadge>
      </div>
      <p>
        {shift.startTime}–{shift.endTime}
      </p>
      <p className="employee-card__lead">
        {formatEmployeeCurrency(shift.estimatedEarnings)} {estimateLabel(shift)}
      </p>
      <p className="employee-card__muted">{shift.transport}</p>
      {shift.status === "available" ? (
        <Button
          aria-label={shiftRequestLabel(shift)}
          onClick={() => onRequest(shift)}
        >
          Request shift
        </Button>
      ) : null}
    </Card>
  );
}

export function EmployeeShifts() {
  const shifts = useDemoSelector((state) => state.employee.shifts);
  const capabilities = useDemoCapabilities();
  const [confirmation, setConfirmation] = useState<ShiftConfirmation | null>(
    null,
  );
  const [recoveryMessage, setRecoveryMessage] = useState("");
  const confirmed = shifts.filter((shift) => shift.status === "confirmed");
  const additional = shifts.filter((shift) => shift.status !== "confirmed");
  const selectedShift = confirmation
    ? (shifts.find((shift) => shift.id === confirmation.shiftId) ?? null)
    : null;

  function closeConfirmation() {
    setConfirmation(null);
    setRecoveryMessage("");
  }

  function requestShift(shift: Shift) {
    setRecoveryMessage("");
    const result = capabilities.employee.requestShift(
      { shiftId: shift.id, confirm: false },
      "ui",
    );
    if (!result.ok) {
      setRecoveryMessage(`${result.error.message} ${result.error.recovery}`);
      return;
    }
    setConfirmation({ shiftId: shift.id, summary: result.summary });
  }

  function confirmShift() {
    if (!confirmation) return;
    const result = capabilities.employee.requestShift(
      { shiftId: confirmation.shiftId, confirm: true },
      "ui",
    );
    if (!result.ok) {
      setRecoveryMessage(`${result.error.message} ${result.error.recovery}`);
      return;
    }
    closeConfirmation();
  }

  return (
    <div className="employee-panel">
      <header className="employee-panel__header">
        <h2>Shifts</h2>
        <p>See confirmed work and request additional shifts.</p>
      </header>
      {recoveryMessage && !confirmation ? (
        <p className="recovery-message" role="alert">
          {recoveryMessage}
        </p>
      ) : null}
      <section aria-labelledby="confirmed-shifts-title">
        <h2 id="confirmed-shifts-title">Confirmed shifts</h2>
        <div className="employee-card-grid">
          {confirmed.map((shift) => (
            <ShiftCard key={shift.id} onRequest={requestShift} shift={shift} />
          ))}
        </div>
      </section>
      <section aria-labelledby="additional-shifts-title">
        <h2 id="additional-shifts-title">Additional shifts</h2>
        <div className="employee-card-grid">
          {additional.map((shift) => (
            <ShiftCard key={shift.id} onRequest={requestShift} shift={shift} />
          ))}
        </div>
      </section>
      <Dialog
        footer={
          <>
            <Button onClick={closeConfirmation} variant="secondary">
              Cancel
            </Button>
            <Button onClick={confirmShift}>Confirm request</Button>
          </>
        }
        onClose={closeConfirmation}
        open={selectedShift !== null}
        title={
          selectedShift
            ? `Request ${selectedShift.role} at ${selectedShift.site}`
            : "Request shift"
        }
      >
        {selectedShift && confirmation ? (
          <div className="confirmation-preview">
            <p>{confirmation.summary}</p>
            <dl className="employee-details">
              <div>
                <dt>Earnings</dt>
                <dd>
                  {formatEmployeeCurrency(selectedShift.estimatedEarnings)}{" "}
                  {estimateLabel(selectedShift)}
                </dd>
              </div>
              <div>
                <dt>Date and time</dt>
                <dd>
                  {formatEmployeeDate(selectedShift.date)},{" "}
                  {selectedShift.startTime}–{selectedShift.endTime}
                </dd>
              </div>
              <div>
                <dt>Request deadline</dt>
                <dd>
                  {selectedShift.deadline
                    ? formatEmployeeDate(selectedShift.deadline)
                    : "No deadline"}
                </dd>
              </div>
              <div>
                <dt>Eligibility</dt>
                <dd>{selectedShift.eligibility}</dd>
              </div>
              <div>
                <dt>Transport</dt>
                <dd>{selectedShift.transport}</dd>
              </div>
            </dl>
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
