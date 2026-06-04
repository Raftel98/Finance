import { cn } from "@/lib/utils";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";

interface MetricCardProps {
  label: string;
  value: string;
  sub?: string;
  trend?: "up" | "down" | "neutral";
  className?: string;
}

export function MetricCard({ label, value, sub, trend, className }: MetricCardProps) {
  return (
    <div className={cn("rounded-lg bg-muted/50 p-4", className)}>
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-xl font-medium tabular-nums leading-tight">{value}</p>
      {sub && (
        <div className="flex items-center gap-1 mt-1">
          {trend === "up" && <TrendingUp className="h-3 w-3 text-success" />}
          {trend === "down" && <TrendingDown className="h-3 w-3 text-destructive" />}
          {trend === "neutral" && <Minus className="h-3 w-3 text-muted-foreground" />}
          <p
            className={cn(
              "text-xs",
              trend === "up" && "text-success",
              trend === "down" && "text-destructive",
              (!trend || trend === "neutral") && "text-muted-foreground"
            )}
          >
            {sub}
          </p>
        </div>
      )}
    </div>
  );
}
