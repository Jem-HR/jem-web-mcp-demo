import type { HTMLAttributes } from "react";

export type StatusTone = "neutral" | "success" | "warning" | "info" | "danger";

export interface StatusBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: StatusTone;
}

export function StatusBadge({
  className,
  tone = "neutral",
  ...props
}: StatusBadgeProps) {
  return (
    <span
      {...props}
      className={["status-badge", `status-badge--${tone}`, className]
        .filter(Boolean)
        .join(" ")}
    />
  );
}
