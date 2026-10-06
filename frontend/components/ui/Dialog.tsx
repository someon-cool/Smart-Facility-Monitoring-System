"use client";

import { forwardRef, type ReactNode } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";
import { IconButton } from "./IconButton";

/* ─── Root / Trigger re-exports ─── */
export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;

/* ─── Overlay (scrim) ─── */
const DialogOverlay = forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50",
      "data-[state=open]:animate-in data-[state=open]:fade-in-0",
      "data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
      className
    )}
    style={{ backgroundColor: "rgb(18 18 17 / 0.5)" }}
    {...props}
  />
));
DialogOverlay.displayName = "DialogOverlay";

/* ─── Content ─── */
export interface DialogContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  children: ReactNode;
}

export const DialogContent = forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>(({ className, children, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-1/2 top-1/2 z-50 w-full max-w-[480px] -translate-x-1/2 -translate-y-1/2",
        "rounded-[var(--r-lg)] p-6",
        "shadow-[var(--shadow-3)]",
        "focus:outline-none",
        /* full-screen sheet below 640px */
        "max-sm:max-w-full max-sm:h-full max-sm:rounded-none max-sm:top-0 max-sm:left-0 max-sm:translate-x-0 max-sm:translate-y-0",
        className
      )}
      style={{ backgroundColor: "var(--bg-raised)" }}
      {...props}
    >
      {children}
      <DialogPrimitive.Close asChild>
        <IconButton
          label="Close"
          className="absolute right-4 top-4"
          style={{ color: "var(--text-3)" }}
        >
          <X size={18} strokeWidth={1.5} />
        </IconButton>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
));
DialogContent.displayName = "DialogContent";

/* ─── Header ─── */
export function DialogHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-1.5 mb-4", className)} {...props} />;
}

/* ─── Title ─── */
export const DialogTitle = forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-h2", className)}
    style={{ color: "var(--text-1)" }}
    {...props}
  />
));
DialogTitle.displayName = "DialogTitle";

/* ─── Description ─── */
export const DialogDescription = forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-body", className)}
    style={{ color: "var(--text-2)" }}
    {...props}
  />
));
DialogDescription.displayName = "DialogDescription";

/* ─── Footer ─── */
export function DialogFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex justify-end gap-3 mt-6", className)}
      {...props}
    />
  );
}
