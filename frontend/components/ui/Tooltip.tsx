"use client";

import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "@/lib/cn";
import { type ReactNode } from "react";

export const TooltipProvider = TooltipPrimitive.Provider;

export interface TooltipProps {
  children: ReactNode;
  content: ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  sideOffset?: number;
  className?: string;
  delayDuration?: number;
}

export function Tooltip({
  children,
  content,
  side = "top",
  sideOffset = 6,
  className,
  delayDuration = 300,
}: TooltipProps) {
  return (
    <TooltipPrimitive.Root delayDuration={delayDuration}>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side={side}
          sideOffset={sideOffset}
          className={cn(
            "z-50 px-3 py-1.5 rounded-[var(--radius-md)]",
            "text-caption shadow-[var(--shadow-2)]",
            "animate-in fade-in-0 zoom-in-95",
            className
          )}
          style={{
            backgroundColor: "var(--bg-raised)",
            color: "var(--text-1)",
            border: "1px solid var(--border-hairline)",
          }}
        >
          {content}
          <TooltipPrimitive.Arrow
            style={{ fill: "var(--bg-raised)" }}
          />
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}
