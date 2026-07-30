import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@dbk/utils";
import { Card } from "../primitives/Card";

export interface AnalyticsCardProps {
  label: string;
  value: string;
  /** Positive/negative trend, rendered with a muted color per §3.6 — never
   * a saturated red/green (05-design-principles.md's Calm Interfaces). */
  trend?: { direction: "up" | "down"; value: string } | null;
  className?: string;
}

export function AnalyticsCard({ label, value, trend, className }: AnalyticsCardProps) {
  return (
    <Card className={cn("flex flex-col gap-1 p-[var(--space-200)]", className)}>
      <p className="text-[13px] text-text-secondary">{label}</p>
      <p className="font-sans text-[22px] font-semibold tabular-nums text-text-primary">{value}</p>
      {trend ? (
        <p
          className={cn(
            "flex items-center gap-1 text-[12px] tabular-nums",
            trend.direction === "up" ? "text-success" : "text-error",
          )}
        >
          {trend.direction === "up" ? (
            <ArrowUpRight className="size-3.5" aria-hidden />
          ) : (
            <ArrowDownRight className="size-3.5" aria-hidden />
          )}
          {trend.value}
        </p>
      ) : null}
    </Card>
  );
}
