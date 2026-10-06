"use client";

import { type ReactNode } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";
import { IconButton } from "./IconButton";

export const Drawer = DialogPrimitive.Root;
export const DrawerTrigger = DialogPrimitive.Trigger;

export interface DrawerContentProps {
  children: ReactNode;
  title: string;
  description?: string;
  footer?: ReactNode;
  className?: string;
  bodyClassName?: string;
}

/**
 * Side drawer: 480px (full-width below 640px), slides from the right.
 * Sticky header (title + close) and optional sticky footer.
 * Built on Radix Dialog for focus trap, Esc, aria-modal.
 */
export function DrawerContent({
  children,
  title,
  description,
  footer,
  className,
  bodyClassName,
}: DrawerContentProps) {
  return (
    <DialogPrimitive.Portal>
      {/* Scrim */}
      <DialogPrimitive.Overlay
        className="fixed inset-0 z-50"
        style={{ backgroundColor: "rgb(18 18 17 / 0.5)" }}
      />

      <DialogPrimitive.Content
        className={cn(
          "fixed right-0 top-0 z-50 h-full w-full max-w-[480px]",
          "flex flex-col",
          "shadow-[var(--shadow-3)]",
          "focus:outline-none",
          "max-sm:max-w-full",
          className
        )}
        style={{ backgroundColor: "var(--bg-surface)" }}
      >
        {/* Sticky header */}
        <div
          className="flex items-center justify-between px-6 py-4 shrink-0 border-b"
          style={{ borderColor: "var(--border-hairline)" }}
        >
          <div>
            <DialogPrimitive.Title className="text-h3" style={{ color: "var(--text-1)" }}>
              {title}
            </DialogPrimitive.Title>
            {description && (
              <DialogPrimitive.Description
                className="text-caption mt-0.5"
                style={{ color: "var(--text-3)" }}
              >
                {description}
              </DialogPrimitive.Description>
            )}
          </div>
          <DialogPrimitive.Close asChild>
            <IconButton label="Close" style={{ color: "var(--text-3)" }}>
              <X size={18} strokeWidth={1.5} />
            </IconButton>
          </DialogPrimitive.Close>
        </div>

        {/* Scrollable body */}
        <div className={cn("flex-1 overflow-y-auto px-6 py-5", bodyClassName)}>
          {children}
        </div>

        {/* Sticky footer */}
        {footer && (
          <div
            className="shrink-0 px-6 py-4 border-t"
            style={{ borderColor: "var(--border-hairline)" }}
          >
            {footer}
          </div>
        )}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
