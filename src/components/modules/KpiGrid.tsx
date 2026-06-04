import { cn } from "@/lib/utils";

interface Props {
  savingsRate: number;
  monthlyIncome: number;
  totalDebt: number;
}

interface KpiItemProps {
  label: string;
  value: string;
  status: "good" | "warn" | "bad" | "neutral";
  description: string;
}

function KpiItem({ label, value, status, description }: KpiItemProps) {
  return (
    <div className="rounded-lg bg-muted/50 p-3">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p
        className={cn(
          "text-lg font-medium tabular-nums mt-0.5",
          status === "good" && "text-success",
          status === "warn" && "text-warning",
          status === "bad" && "text-destructive",
          status === "neutral" && "text-foreground"
        )}
      >
        {value}
      </p>
      <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{description}</p>
    </div>
  );
}

export function KpiGrid({ savingsRate, monthlyIncome, totalDebt }: Props) {
  const dti = monthlyIncome > 0 ? totalDebt / monthlyIncome : 0;

  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="text-sm font-medium mb-4">KPIs</p>
      <div className="grid grid-cols-2 gap-2">
        <KpiItem
          label="Savings rate"
          value={`${savingsRate.toFixed(0)}%`}
          status={savingsRate >= 30 ? "good" : savingsRate >= 15 ? "warn" : "bad"}
          description={savingsRate >= 30 ? "Above 30% target" : "Target: 30%+"}
        />
        <KpiItem
          label="Debt-to-income"
          value={`${dti.toFixed(1)}×`}
          status={dti <= 2 ? "good" : dti <= 4 ? "warn" : "bad"}
          description="Monthly basis"
        />
        <KpiItem
          label="Credit util."
          value="28%"
          status="good"
          description="Below 30% target"
        />
        <KpiItem
          label="Runway"
          value="5.2 mo"
          status="good"
          description="At current burn rate"
        />
      </div>
    </div>
  );
}
