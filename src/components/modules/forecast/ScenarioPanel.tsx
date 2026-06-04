"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, ChevronDown, ChevronRight, Check } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { useScenarios, useCreateScenario, useDeleteScenario, useCreateAdjustment, useDeleteAdjustment, type ForecastScenario } from "@/hooks/useForecast";
import { SUPPORTED_CURRENCIES } from "@/lib/constants";

const ADJ_TYPES = [
  { value: "INCOME_CHANGE", label: "Income Change" },
  { value: "EXPENSE_CHANGE", label: "Expense Change" },
  { value: "NEW_EXPENSE", label: "New Expense" },
  { value: "ASSET_CHANGE", label: "Asset Change" },
  { value: "DEBT_CHANGE", label: "Debt Change" },
];

const adjSchema = z.object({
  description: z.string().min(1),
  adjustmentType: z.enum(["INCOME_CHANGE", "EXPENSE_CHANGE", "NEW_EXPENSE", "ASSET_CHANGE", "DEBT_CHANGE"]),
  impactAmount: z.preprocess((v) => (v === "" || v == null ? null : Number(v)), z.number().nullable().optional()),
  impactPercent: z.preprocess((v) => (v === "" || v == null ? null : Number(v)), z.number().nullable().optional()),
  startDate: z.string().min(1),
  endDate: z.string().optional().nullable(),
  currency: z.string().optional().nullable(),
});

const scenarioFormSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["BASE", "OPTIMISTIC", "CONSERVATIVE", "CUSTOM"]),
});

interface Props {
  activeScenarioId?: string;
  onSelectScenario: (id: string | undefined) => void;
  baseCurrency: string;
}

export function ScenarioPanel({ activeScenarioId, onSelectScenario, baseCurrency }: Props) {
  const { data } = useScenarios();
  const createScenario = useCreateScenario();
  const deleteScenario = useDeleteScenario();
  const createAdj = useCreateAdjustment();
  const deleteAdj = useDeleteAdjustment();

  const [expanded, setExpanded] = useState<string | null>(null);
  const [showNewScenario, setShowNewScenario] = useState(false);
  const [showAdjForm, setShowAdjForm] = useState<string | null>(null);

  const scenarioForm = useForm({ resolver: zodResolver(scenarioFormSchema), defaultValues: { name: "", type: "CUSTOM" as const } });
  const adjForm = useForm({ resolver: zodResolver(adjSchema), defaultValues: { description: "", adjustmentType: "EXPENSE_CHANGE" as const, startDate: "" } });

  const scenarios = data?.scenarios ?? [];

  async function handleCreateScenario(values: z.infer<typeof scenarioFormSchema>) {
    await createScenario.mutateAsync(values);
    scenarioForm.reset();
    setShowNewScenario(false);
  }

  async function handleCreateAdj(scenarioId: string, values: z.infer<typeof adjSchema>) {
    await createAdj.mutateAsync({ ...values, scenarioId });
    adjForm.reset();
    setShowAdjForm(null);
  }

  const TYPE_COLORS: Record<string, string> = {
    BASE: "bg-blue-100 text-blue-700",
    OPTIMISTIC: "bg-green-100 text-green-700",
    CONSERVATIVE: "bg-orange-100 text-orange-700",
    CUSTOM: "bg-purple-100 text-purple-700",
  };

  const ADJ_COLORS: Record<string, string> = {
    INCOME_CHANGE: "bg-green-100 text-green-700",
    EXPENSE_CHANGE: "bg-orange-100 text-orange-700",
    NEW_EXPENSE: "bg-red-100 text-red-700",
    ASSET_CHANGE: "bg-blue-100 text-blue-700",
    DEBT_CHANGE: "bg-purple-100 text-purple-700",
  };

  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Scenarios</h3>
        <button
          onClick={() => setShowNewScenario(!showNewScenario)}
          className="flex items-center gap-1 text-xs bg-foreground text-background rounded-md px-2 py-1 hover:bg-foreground/90 transition-colors"
        >
          <Plus className="h-3 w-3" /> New
        </button>
      </div>

      {showNewScenario && (
        <form
          onSubmit={scenarioForm.handleSubmit(handleCreateScenario)}
          className="rounded-lg border bg-muted/30 p-3 space-y-2"
        >
          <input
            {...scenarioForm.register("name")}
            placeholder="Scenario name"
            className="w-full h-9 px-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <select
            {...scenarioForm.register("type")}
            className="w-full h-9 px-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="BASE">Base</option>
            <option value="OPTIMISTIC">Optimistic</option>
            <option value="CONSERVATIVE">Conservative</option>
            <option value="CUSTOM">Custom</option>
          </select>
          <div className="flex gap-2">
            <button type="submit" disabled={createScenario.isPending} className="bg-foreground text-background rounded-md px-3 py-1.5 text-xs font-medium hover:bg-foreground/90 transition-colors disabled:opacity-50">
              Create
            </button>
            <button type="button" onClick={() => setShowNewScenario(false)} className="text-xs px-3 py-1.5 rounded-md border hover:bg-muted transition-colors">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        <button
          onClick={() => onSelectScenario(undefined)}
          className={cn(
            "w-full flex items-center justify-between rounded-lg border p-2 text-sm transition-colors",
            !activeScenarioId ? "border-foreground bg-muted/50" : "hover:bg-muted/30"
          )}
        >
          <span>No scenario (baseline)</span>
          {!activeScenarioId && <Check className="h-4 w-4" />}
        </button>

        {scenarios.map((s) => (
          <div key={s.id} className="rounded-lg border overflow-hidden">
            <div
              className={cn(
                "flex items-center gap-2 p-2 cursor-pointer transition-colors",
                activeScenarioId === s.id ? "bg-muted/50 border-foreground" : "hover:bg-muted/30"
              )}
            >
              <button
                onClick={() => setExpanded(expanded === s.id ? null : s.id)}
                className="flex-1 flex items-center gap-2 text-left text-sm"
              >
                {expanded === s.id ? <ChevronDown className="h-3 w-3 shrink-0" /> : <ChevronRight className="h-3 w-3 shrink-0" />}
                <span className="font-medium truncate">{s.name}</span>
                <span className={cn("text-xs px-1.5 py-0.5 rounded-full", TYPE_COLORS[s.type])}>{s.type}</span>
              </button>
              <button
                onClick={() => onSelectScenario(activeScenarioId === s.id ? undefined : s.id)}
                className={cn(
                  "text-xs px-2 py-1 rounded border transition-colors shrink-0",
                  activeScenarioId === s.id ? "bg-foreground text-background" : "hover:bg-muted"
                )}
              >
                {activeScenarioId === s.id ? "Active" : "Apply"}
              </button>
              <button
                onClick={() => deleteScenario.mutate(s.id)}
                className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors shrink-0"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>

            {expanded === s.id && (
              <div className="border-t bg-muted/20 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground font-medium">Adjustments ({s.adjustments.length})</p>
                  <button
                    onClick={() => setShowAdjForm(showAdjForm === s.id ? null : s.id)}
                    className="text-xs flex items-center gap-1 px-2 py-1 rounded border hover:bg-muted transition-colors"
                  >
                    <Plus className="h-3 w-3" /> Add
                  </button>
                </div>

                {showAdjForm === s.id && (
                  <form
                    onSubmit={adjForm.handleSubmit((v) => handleCreateAdj(s.id, v))}
                    className="rounded-lg border bg-background p-2 space-y-2"
                  >
                    <input
                      {...adjForm.register("description")}
                      placeholder="Description"
                      className="w-full h-8 px-2 rounded border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                    <select
                      {...adjForm.register("adjustmentType")}
                      className="w-full h-8 px-2 rounded border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                      {ADJ_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        {...adjForm.register("impactAmount")}
                        type="number"
                        placeholder="Amount"
                        className="h-8 px-2 rounded border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                      <input
                        {...adjForm.register("impactPercent")}
                        type="number"
                        placeholder="% change"
                        className="h-8 px-2 rounded border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-muted-foreground">Start</label>
                        <input
                          {...adjForm.register("startDate")}
                          type="date"
                          className="w-full h-8 px-2 rounded border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">End (optional)</label>
                        <input
                          {...adjForm.register("endDate")}
                          type="date"
                          className="w-full h-8 px-2 rounded border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                        />
                      </div>
                    </div>
                    <select
                      {...adjForm.register("currency")}
                      className="w-full h-8 px-2 rounded border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                      <option value="">Currency (optional)</option>
                      {SUPPORTED_CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <div className="flex gap-2">
                      <button type="submit" disabled={createAdj.isPending} className="bg-foreground text-background rounded px-2 py-1 text-xs font-medium hover:bg-foreground/90 disabled:opacity-50 transition-colors">
                        Save
                      </button>
                      <button type="button" onClick={() => setShowAdjForm(null)} className="text-xs px-2 py-1 rounded border hover:bg-muted transition-colors">
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                {s.adjustments.length === 0 && (
                  <p className="text-xs text-muted-foreground py-2 text-center">No adjustments yet</p>
                )}

                {s.adjustments.map((adj) => (
                  <div key={adj.id} className="flex items-start justify-between gap-2 rounded border bg-background p-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="text-xs font-medium truncate">{adj.description}</span>
                        <span className={cn("text-xs px-1 py-0.5 rounded-full shrink-0", ADJ_COLORS[adj.adjustmentType])}>
                          {ADJ_TYPES.find((t) => t.value === adj.adjustmentType)?.label ?? adj.adjustmentType}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {adj.impactAmount !== null && (
                          <span className="text-xs text-muted-foreground tabular-nums">
                            {formatCurrency(adj.impactAmount, adj.currency ?? baseCurrency)}
                          </span>
                        )}
                        {adj.impactPercent !== null && (
                          <span className="text-xs text-muted-foreground tabular-nums">
                            {adj.impactPercent > 0 ? "+" : ""}{adj.impactPercent}%
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {adj.startDate.slice(0, 7)}{adj.endDate ? ` → ${adj.endDate.slice(0, 7)}` : ""}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteAdj.mutate(adj.id)}
                      className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors shrink-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
