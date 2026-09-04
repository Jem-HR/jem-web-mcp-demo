import type { HTMLAttributes } from "react";

export interface CardProps extends HTMLAttributes<HTMLElement> {
  as?: "article" | "section" | "div";
}

export function Card({
  as: Component = "article",
  className,
  ...props
}: CardProps) {
  return (
    <Component
      {...props}
      className={["card", className].filter(Boolean).join(" ")}
    />
  );
}
