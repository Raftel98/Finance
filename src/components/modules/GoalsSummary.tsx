import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  currency: string;
  deadline: string | null;
}

interface Props {
  goals: Goal[];
}

export function GoalsSummary({ goals }: Props) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium">Goals</p>
        <Link
          href="/dashboard/goals"
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {goals.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">
          No goals yet.{" "}
          <Link href="/dashboard/goals" className="underline">
            Create one
          </Link>
        </p>
      ) : (
        <div className="space-y-4">
          {goals.map((goal) => {
            const pct = Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
            const isOnTrack = pct >= 50;
            return (
              <div key={goal.id}>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium truncate">{goal.name}</p>
                  <span
                    className={cn(
                      "text-xs font-medium",
                      pct >= 75 ? "text-success" : pct >= 40 ? "text-warning" : "text-destructive"
                    )}
                  >
                    {pct.toFixed(0)}%
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      pct >= 75 ? "bg-success" : pct >= 40 ? "bg-warning" : "bg-destructive"
                    )}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  <p className="text-xs text-muted-foreground tabular-nums">
                    {formatCurrency(goal.currentAmount, goal.currency, true)} /{" "}
                    {formatCurrency(goal.targetAmount, goal.currency, true)}
                  </p>
                  {goal.deadline && (
                    <p className="text-xs text-muted-foreground">
                      {formatDate(goal.deadline, "short")}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
