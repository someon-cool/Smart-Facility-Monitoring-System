"use client";

import { useState, useCallback } from "react";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/cn";
import { Tooltip } from "./Tooltip";

export interface CopyableIdProps {
  /** The full ID string */
  fullId: string;
  /** Visible short form — defaults to last 6 chars with prefix */
  shortId?: string;
  className?: string;
}

/**
 * Monospace short ID with copy button.
 * Displays TKT-…{last 6} with the full ID in a tooltip.
 * Copy button shows "Copied" toast via aria-live.
 */
export function CopyableId({ fullId, shortId, className }: CopyableIdProps) {
  const [copied, setCopied] = useState(false);

  const displayId = shortId ?? truncateId(fullId);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(fullId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = fullId;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [fullId]);

  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      <Tooltip content={fullId}>
        <code
          className="font-mono text-caption px-1 py-0.5 rounded-[var(--radius-sm)]"
          style={{
            backgroundColor: "var(--bg-subtle)",
            color: "var(--text-2)",
          }}
        >
          {displayId}
        </code>
      </Tooltip>
      <button
        onClick={handleCopy}
        className={cn(
          "inline-flex items-center justify-center w-6 h-6 rounded-[var(--radius-sm)]",
          "transition-colors duration-[var(--dur-fast)]",
          "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--accent-ring)]",
        )}
        style={{ color: copied ? "var(--healthy-fg)" : "var(--text-3)" }}
        aria-label={copied ? "Copied" : "Copy ID"}
      >
        {copied ? (
          <Check size={14} strokeWidth={1.5} />
        ) : (
          <Copy size={14} strokeWidth={1.5} />
        )}
      </button>
      {copied && (
        <span className="sr-only" aria-live="polite">
          Copied
        </span>
      )}
    </span>
  );
}

function truncateId(id: string): string {
  if (id.length <= 12) return id;
  // e.g. TKT-T2_RA_WC_03-20240121T0940Z → TKT-…0940Z
  const prefix = id.substring(0, 4); // "TKT-"
  const suffix = id.substring(id.length - 6);
  return `${prefix}…${suffix}`;
}
