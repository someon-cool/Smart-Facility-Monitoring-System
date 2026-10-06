"use client";

import { useEffect, useState } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { formatDateTime } from "@/lib/format";

export interface ReplayScrubberProps {
  simStart: string;
  simDurationHours: number;
  currentHours: number;
  onChangeHours: (hours: number | ((prev: number) => number)) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onReset: () => void;
  className?: string;
}

export function ReplayScrubber({
  simStart,
  simDurationHours,
  currentHours,
  onChangeHours,
  isPlaying,
  onTogglePlay,
  onReset,
  className,
}: ReplayScrubberProps) {
  const [speed, setSpeed] = useState<number>(2);

  // Playback timer effect
  useEffect(() => {
    if (!isPlaying) return;

    const intervalMs = 250;
    const increment = (speed * intervalMs) / 1000;

    const timer = setInterval(() => {
      onChangeHours((prev: number) => {
        const next = prev + increment;
        if (next >= simDurationHours) {
          onTogglePlay();
          return simDurationHours;
        }
        return next;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPlaying, speed, simDurationHours, onChangeHours, onTogglePlay]);

  // Compute simulated timestamp from currentHours
  const currentTimestamp = () => {
    const startDate = new Date(simStart || "2024-10-02T00:00:00");
    const d = new Date(startDate.getTime() + currentHours * 3600 * 1000);
    return formatDateTime(d);
  };

  const progressPercent = Math.min(
    100,
    Math.round((currentHours / simDurationHours) * 100)
  );

  return (
    <div
      className={cn(
        "rounded-[var(--r-md)] border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4 flex flex-col gap-3",
        className
      )}
    >
      {/* Top row: controls and timestamp */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {/* Ink-filled primary play/pause */}
          <Button
            variant="primary"
            size="sm"
            onClick={onTogglePlay}
            id="btn-replay-play"
            className="gap-1.5"
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4 fill-current" />
            )}
            <span>{isPlaying ? "Pause" : "Play"}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            id="btn-replay-reset"
            className="gap-1 text-xs"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset</span>
          </Button>

          {/* Speed picker */}
          <div className="flex items-center rounded-[var(--r-sm)] border border-[var(--border-hairline)] bg-[var(--bg-subtle)] p-0.5 text-xs">
            {[1, 2, 4, 8].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSpeed(s)}
                className={cn(
                  "px-2 py-0.5 rounded-[var(--r-sm)] font-medium transition-colors cursor-pointer select-none",
                  speed === s
                    ? "bg-[var(--bg-surface)] text-[var(--text-1)] shadow-sm font-semibold"
                    : "text-[var(--text-3)] hover:text-[var(--text-1)]"
                )}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        {/* Readout */}
        <div className="flex items-baseline gap-2 font-mono text-xs">
          <span className="text-[var(--text-3)] font-sans">Simulated Time:</span>
          <span className="font-semibold text-[var(--text-1)] tabular-nums num text-sm">
            {currentTimestamp()}
          </span>
          <span className="text-[var(--text-3)] tabular-nums">
            ({Math.round(currentHours)}h / {simDurationHours}h · {progressPercent}%)
          </span>
        </div>
      </div>

      {/* Scrubber slider: min 44px touch target */}
      <div className="relative py-2 flex items-center">
        <input
          type="range"
          min={0}
          max={simDurationHours}
          step={0.1}
          value={currentHours}
          onChange={(e) => onChangeHours(parseFloat(e.target.value))}
          className="w-full h-2 rounded-lg bg-[var(--bg-subtle)] appearance-none cursor-pointer accent-[var(--accent-ring)]"
          aria-label="Replay simulation timeline scrubber"
        />
      </div>
    </div>
  );
}
