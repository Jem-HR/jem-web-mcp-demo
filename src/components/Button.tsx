import type { ButtonHTMLAttributes } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "navy";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  pending?: boolean;
}

export function Button({
  children,
  className,
  disabled,
  pending = false,
  type = "button",
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      aria-busy={pending || undefined}
      className={["button", `button--${variant}`, className]
        .filter(Boolean)
        .join(" ")}
      disabled={disabled || pending}
      type={type}
    >
      {children}
    </button>
  );
}
