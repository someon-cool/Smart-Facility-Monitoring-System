import { type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { OctagonAlert } from "lucide-react";
import { Button } from "./Button";

export interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
  details?: ReactNode;
  className?: string;
}

/**
 * Inline error banner: critical tint with icon, one human sentence, "Retry" button.
 * Never expose stack traces or raw status codes (put them in a disclosure).
 */
export function ErrorState({
  message,
  onRetry,
  details,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-[var(--r-md)] px-4 py-3",
        className
      )}
      style={{
        backgroundColor: "var(--critical-tint)",
        color: "var(--critical-fg)",
      }}
      role="alert"
    >
      <OctagonAlert size={18} strokeWidth={1.5} className="shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-body font-medium">{message}</p>
        {details && (
          <div className="mt-1 text-caption opacity-80">{details}</div>
        )}
      </div>
      {onRetry && (
        <Button variant="text" size="sm" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
}
