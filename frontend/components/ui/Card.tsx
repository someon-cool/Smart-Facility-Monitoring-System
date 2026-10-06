import { type HTMLAttributes, type ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const cardVariants = cva("", {
  variants: {
    tier: {
      hero: [
        "rounded-[var(--r-lg)] p-6",
        "border border-[var(--border-hairline)]",
      ].join(" "),
      standard: [
        "rounded-[var(--r-md)] p-5",
        "border border-[var(--border-hairline)]",
      ].join(" "),
      flat: "p-0",
    },
  },
  defaultVariants: {
    tier: "standard",
  },
});

export interface CardProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "article";
}

/**
 * Three-tier card system:
 *  - hero: at most 1 per screen, bg-surface, hairline, r-lg, shadow-1, 24px padding
 *  - standard: grouped modules, bg-surface, hairline, r-md, no shadow, 20px padding
 *  - flat: no background, no border, separated by hairlines and spacing
 */
export function Card({
  tier,
  children,
  className,
  as: Tag = "div",
  ...props
}: CardProps) {
  const isHero = tier === "hero";
  const isFlat = tier === "flat";

  return (
    <Tag
      className={cn(cardVariants({ tier }), className)}
      style={
        isFlat
          ? undefined
          : {
              backgroundColor: "var(--bg-surface)",
              boxShadow: isHero ? "var(--shadow-1)" : undefined,
            }
      }
      {...props}
    >
      {children}
    </Tag>
  );
}
