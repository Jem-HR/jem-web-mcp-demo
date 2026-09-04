import { formatCurrency } from "../components/format";
import type { RewardDestination, Shift } from "../demo/types";

const months = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

const dayNames = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export function formatEmployeeCurrency(amount: number): string {
  return formatCurrency(amount).replace(/^R\s*/, "R");
}

export function formatEmployeeDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const monthName = month === undefined ? undefined : months[month - 1];
  if (year === undefined || day === undefined || monthName === undefined) {
    return isoDate;
  }
  return `${day} ${monthName} ${year}`;
}

export function estimateLabel(shift: Pick<Shift, "estimateKind">): string {
  return shift.estimateKind === "confirmed_before_deductions"
    ? "confirmed before deductions"
    : "estimated before deductions";
}

export function shiftDuration(shift: Pick<Shift, "startTime" | "endTime">) {
  const [startHour = 0, startMinute = 0] = shift.startTime
    .split(":")
    .map(Number);
  const [endHour = 0, endMinute = 0] = shift.endTime.split(":").map(Number);
  const minutes = endHour * 60 + endMinute - (startHour * 60 + startMinute);
  return `${minutes / 60} hours`;
}

export function shiftRequestLabel(
  shift: Pick<Shift, "date" | "role" | "site">,
): string {
  const date = new Date(`${shift.date}T00:00:00.000Z`);
  const day = Number.isNaN(date.getTime())
    ? "available"
    : dayNames[date.getUTCDay()];
  return `Request ${day} ${shift.role} shift at ${shift.site}`;
}

export function destinationLabel(destination: RewardDestination): string {
  return destination === "savings" ? "Jem Savings" : "a voucher";
}
