import { type ReactNode, type HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export interface VisuallyHiddenProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
  as?: "span" | "div";
}

/**
 * Screen-reader-only utility that hides content visually while keeping it
 * accessible to assistive technologies.
 */
export function VisuallyHidden({
  children,
  as: Component = "span",
  className,
  ...props
}: VisuallyHiddenProps) {
  return (
    <Component
      className={cn("sr-only", className)}
      {...props}
    >
      {children}
    </Component>
  );
}
