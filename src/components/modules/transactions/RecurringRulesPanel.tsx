"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Plus, Trash2, RefreshCw } from "lucide-react";
import { SUPPORTED_CURRENCIES } from "@/lib/constants";
import { useCategories } from "@/hooks/useCategories";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { recurringRuleSchema, type RecurringRuleInput } from "@/lib/validations/recurring";

const FREQ_LABELS: Record<string, string> = {
  DAILY: "Daily",
  WEEKLY: "Weekly",
  MONTHLY: "Monthly",
  YEARLY: "Yearly",
};

function useRecurringRules() {
  return useQuery({
    queryKey: ["recurring-rules"],
    queryFn: async () => {
      const res = await fetch("/api/recurring-rules");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json() as Promise<{ rules: any[] }>;
    },
  });
}

interface RuleFormProps {
  defaultValues?: Partial<RecurringRuleInput>;
  onSubmit: (data: RecurringRuleInput) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

function RuleForm({ defaultValues, onSubmit, onCancel, isSubmitting }: RuleFormProps) {
  const { data: categories = [] } = useCategories();
  const { register, handleSubmit, watch, formState: { errors } } = useForm<RecurringRuleInput>({
    resolver: zodResolver(recurringRuleSchema),
    defaultValues: { isActive: true, frequency: "MONTHLY", currency: "COP", ...defaultValues },
  });

  const selectedType = watch("type");
  const filteredCats = categories.filter(
    (c) => c.type === (selectedType === "INCOME" ? "INCOME" : "EXPENSE")
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="border rounded-xl p-4 bg-muted/20 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Name</label>
          <input {...register("name")} placeholder="Monthly salary" className="w-full h-8 px-2 rounded-md border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-ring" />
          {errors.name && <p className="text-destructive text-[10px] mt-0.5">{errors.name.message}</p>}
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Type</label>
          <select {...register("type")} className="w-full h-8 px-2 rounded-md border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-ring">
            <option value="INCOME">Income</option>
            <option value="EXPENSE">Expense</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Amount</label>
          <input {...register("amount")} type="number" step="any" min="0" placeholder="0.00" className="w-full h-8 px-2 rounded-md border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-ring" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Currency</label>
          <select {...register("currency")} className="w-full h-8 px-2 rounded-md border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-ring">
            {SUPPORTED_CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Frequency</label>
          <select {...register("frequency")} className="w-full h-8 px-2 rounded-md border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-ring">
            {Object.entries(FREQ_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Day of month</label>
          <input {...register("dayOfMonth")} type="number" min="1" max="31" placeholder="1–31" className="w-full h-8 px-2 rounded-md border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-ring" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Start date</label>
          <input {...register("startDate")} type="date" className="w-full h-8 px-2 rounded-md border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-ring" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Category</label>
          <select {...register("categoryId")} className="w-full h-8 px-2 rounded-md border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-ring">
            <option value="">None</option>
            {filteredCats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="h-7 px-3 rounded-md border text-xs hover:bg-muted">Cancel</button>
        <button type="submit" disabled={isSubmitting} className="h-7 px-3 rounded-md bg-foreground text-background text-xs hover:bg-foreground/90 disabled:opacity-50">
          {isSubmitting ? "Saving…" : "Save rule"}
        </button>
      </div>
    </form>
  );
}

export function RecurringRulesPanel({ baseCurrency }: { baseCurrency: string }) {
  const qc = useQueryClient();
  const { data, isLoading } = useRecurringRules();
  const [showForm, setShowForm] = useState(false);

  const createMutation = useMutation({
    mutationFn: async (data: RecurringRuleInput) => {
      const res = await fetch("/api/recurring-rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["recurring-rules"] }); setShowForm(false); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/recurring-rules/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["recurring-rules"] }),
  });

  if (isLoading) return (
    <div className="flex items-center justify-center py-10 text-muted-foreground">
      <RefreshCw className="h-4 w-4 animate-spin mr-2" /><span className="text-sm">Loading…</span>
    </div>
  );

  const rules = data?.rules ?? [];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">{rules.length} rule{rules.length !== 1 ? "s" : ""}</p>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 rounded-md bg-foreground px-3 py-1.5 text-xs font-medium text-background hover:bg-foreground/90"
        >
          <Plus className="h-3.5 w-3.5" /> Add rule
        </button>
      </div>

      {showForm && (
        <div className="mb-4">
          <RuleForm
            onSubmit={(data) => createMutation.mutateAsync(data)}
            onCancel={() => setShowForm(false)}
            isSubmitting={createMutation.isPending}
          />
        </div>
      )}

      {rules.length === 0 && !showForm ? (
        <div className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">
          No recurring rules yet. Add one to power forecasting.
        </div>
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Name</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Type</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Frequency</th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">Amount</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Next occurrence</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rules.map((rule: any) => (
                <tr key={rule.id} className="hover:bg-muted/20 group">
                  <td className="px-4 py-3 font-medium text-sm">{rule.name}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${rule.type === "INCOME" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                      {rule.type.toLowerCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {FREQ_LABELS[rule.frequency]}
                    {rule.dayOfMonth ? ` (day ${rule.dayOfMonth})` : ""}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium">
                    {formatCurrency(Number(rule.amount), rule.currency)}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {formatDate(rule.nextOccurrence, "medium")}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] ${rule.isActive ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
                      {rule.isActive ? "active" : "paused"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 justify-end">
                      <button
                        onClick={() => { if (confirm("Delete this rule?")) deleteMutation.mutate(rule.id); }}
                        className="rounded p-1 hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
