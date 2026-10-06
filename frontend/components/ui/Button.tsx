import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";
import { Loader2 } from "lucide-react";

const buttonVariants = cva(
  /* base */
  [
    "inline-flex items-center justify-center gap-2",
    "font-medium text-[0.875rem] leading-[1.375rem]",
    "transition-colors duration-[var(--dur-fast)] ease-[var(--ease-out)]",
    "disabled:pointer-events-none disabled:opacity-50",
    "focus-visible:outline-2 focus-visible:outline-offset-2",
  ].join(" "),
  {
    variants: {
      variant: {
        primary: [
          "text-[var(--on-ink)]",
          "rounded-[var(--radius-md)]",
          "focus-visible:outline-[var(--accent-ring)]",
        ].join(" "),
        ghost: [
          "text-[var(--text-1)]",
          "border border-[var(--border-strong)]",
          "rounded-[var(--radius-md)]",
          "focus-visible:outline-[var(--accent-ring)]",
        ].join(" "),
        text: [
          "text-[var(--accent-text)]",
          "underline-offset-2",
          "focus-visible:outline-[var(--accent-ring)]",
        ].join(" "),
        danger: [
          "text-[var(--on-ink)]",
          "rounded-[var(--radius-md)]",
          "focus-visible:outline-[var(--accent-ring)]",
        ].join(" "),
      },
      size: {
        sm: "h-8 px-3 text-[0.75rem]",
        md: "h-10 px-4",
        lg: "h-12 px-6 text-[1rem]",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled || loading}
        style={{
          backgroundColor:
            variant === "primary"
              ? "var(--ink)"
              : variant === "danger"
              ? "var(--critical-solid)"
              : variant === "ghost"
              ? "transparent"
              : "transparent",
        }}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
