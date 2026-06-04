"use client";

import { Pencil, Trash2, Target, TrendingUp, AlertTriangle } from "lucide-react";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import type { GoalRow } from "@/hooks/useGoals";

interface GoalCardProps {
  goal: GoalRow;
  onEdit: (goal: GoalRow) => void;
  onDelete: (id: string) => void;
}

const TRACKING_TYPE_LABELS: Record<string, string> = {
  NET_WORTH: "Net Worth",
  SAVINGS: "Savings",
  ASSET: "Asset",
  MANUAL: "Manual",
};

const TRACKING_TYPE_COLORS: Record<string, string> = {
  NET_WORTH: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  SAVINGS: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  ASSET: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  MANUAL: "bg-muted text-muted-foreground",
};

export function GoalCard({ goal, onEdit, onDelete }: GoalCardProps) {
  const pct = Math.min(goal.progressPct, 100);

  const barColor =
    pct >= 75 ? "bg-emerald-500" : pct >= 40 ? "bg-amber-500" : "bg-destructive";

  const isOnTrack =
    !goal.deadline ||
    goal.isCompleted ||
    (goal.projectedCompletionDate
      ? new Date(goal.projectedCompletionDate) <= new Date(goal.deadline)
      : false);

  const StatusIcon = isOnTrack ? TrendingUp : AlertTriangle;

  async function handleDelete() {
    if (!confirm(`Delete goal "${goal.name}"?`)) return;
    onDelete(goal.id);
  }

  return (
    <div className={cn("rounded-xl border bg-card p-4 space-y-4 group relative", goal.isCompleted && "opacity-70")}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1 flex-1 min-w-0">
          <h3 className="text-sm font-medium truncate">{goal.name}</h3>
          <span
            className={cn(
              "inline-block text-xs px-2 py-0.5 rounded-full font-medium",
              TRACKING_TYPE_COLORS[goal.trackingType] ?? "bg-muted text-muted-foreground"
            )}
          >
            {TRACKING_TYPE_LABELS[goal.trackingType] ?? goal.trackingType}
          </span>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(goal)}
            className="p-1 rounded hover:bg-muted"
            title="Edit"
          >
            <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
          <button onClick={handleDelete} className="p-1 rounded hover:bg-muted" title="Delete">
            <Trash2 className="h-3.5 w-3.5 text-destructive" />
          </button>
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex items-end justify-between">
          <span
            className={cn(
              "text-3xl font-semibold tabular-nums leading-none",
              pct >= 75 ? "text-emerald-600 dark:text-emerald-400" : pct >= 40 ? "text-amber-600 dark:text-amber-400" : "text-destructive"
            )}
          >
            {pct.toFixed(0)}%
          </span>
          {goal.isCompleted && (
            <span className="text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full font-medium">
              Completed
            </span>
          )}
        </div>

        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all", barColor)}
            style={{ width: `${pct}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground tabular-nums">
          <span>{formatCurrency(goal.computedAmount, goal.currency, true)}</span>
          <span>{formatCurrency(goal.targetAmount, goal.currency, true)}</span>
        </div>
      </div>

      {/* Footer info */}
      <div className="space-y-1 pt-1 border-t">
        {goal.deadline && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground flex items-center gap-1">
              <Target className="h-3 w-3" />
              Deadline
            </span>
            <span className="tabular-nums">{formatDate(goal.deadline, "medium")}</span>
          </div>
        )}

        {goal.projectedCompletionDate && !goal.isCompleted && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Projected</span>
            <span className="tabular-nums text-muted-foreground">
              {formatDate(goal.projectedCompletionDate, "medium")}
            </span>
          </div>
        )}

        {!goal.isCompleted && (
          <div className="flex items-center justify-between text-xs pt-0.5">
            <span
              className={cn(
                "flex items-center gap-1 font-medium",
                isOnTrack ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
              )}
            >
              <StatusIcon className="h-3 w-3" />
              {isOnTrack ? "On track" : "Behind schedule"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
