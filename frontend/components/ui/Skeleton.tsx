import { cn } from "@/lib/cn";

export interface SkeletonProps {
  className?: string;
  /** Width in px or CSS value */
  width?: string | number;
  /** Height in px or CSS value */
  height?: string | number;
}

/**
 * Skeleton placeholder that matches the geometry of the final content.
 * Uses the shimmer animation defined in globals.css.
 * Automatically disabled under prefers-reduced-motion.
 */
export function Skeleton({ className, width, height }: SkeletonProps) {
  return (
    <div
      className={cn("skeleton", className)}
      style={{
        width: typeof width === "number" ? `${width}px` : width,
        height: typeof height === "number" ? `${height}px` : height,
      }}
      aria-hidden="true"
    />
  );
}

/** Skeleton sized for a metric-hero value */
export function SkeletonMetricHero({ className }: { className?: string }) {
  return <Skeleton width={160} height={52} className={cn("rounded-[var(--r-sm)]", className)} />;
}

/** Skeleton sized for a metric-lg value */
export function SkeletonMetricLg({ className }: { className?: string }) {
  return <Skeleton width={100} height={36} className={cn("rounded-[var(--r-sm)]", className)} />;
}

/** Skeleton for a text line */
export function SkeletonText({
  width = "100%",
  className,
}: {
  width?: string | number;
  className?: string;
}) {
  return <Skeleton width={width} height={14} className={cn("rounded-[var(--r-sm)]", className)} />;
}

/** Skeleton for a table row */
export function SkeletonRow({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-4 py-3", className)}>
      <Skeleton width={60} height={14} />
      <Skeleton width="40%" height={14} />
      <Skeleton width={80} height={14} />
      <Skeleton width={60} height={14} />
    </div>
  );
}/** Skeleton for a card */
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-[var(--r-md)] border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5 space-y-3",
        className
      )}
    >
      <Skeleton width="40%" height={16} />
      <Skeleton width="80%" height={32} />
      <Skeleton width="60%" height={14} />
    </div>
  );
}
