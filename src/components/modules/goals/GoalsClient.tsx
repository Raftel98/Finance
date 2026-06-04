"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { MetricCard } from "@/components/ui/MetricCard";
import { GoalCard } from "./GoalCard";
import { GoalModal } from "./GoalModal";
import { useGoals, useCreateGoal, useUpdateGoal, useDeleteGoal, type GoalRow } from "@/hooks/useGoals";
import type { GoalInput } from "@/lib/validations/goal";

interface GoalsClientProps {
  assets?: { id: string; name: string }[];
}

export function GoalsClient({ assets = [] }: GoalsClientProps) {
  const { data: goals = [], isLoading } = useGoals();
  const createGoal = useCreateGoal();
  const updateGoal = useUpdateGoal();
  const deleteGoal = useDeleteGoal();

  const [showModal, setShowModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<GoalRow | null>(null);

  const activeGoals = goals.filter((g) => !g.isCompleted);
  const onTrackCount = activeGoals.filter((g) => {
    if (!g.deadline) return true;
    if (!g.projectedCompletionDate) return false;
    return new Date(g.projectedCompletionDate) <= new Date(g.deadline);
  }).length;

  const onTrackPct = activeGoals.length > 0 ? Math.round((onTrackCount / activeGoals.length) * 100) : 0;

  async function handleSubmit(data: GoalInput) {
    if (editingGoal) {
      await updateGoal.mutateAsync({ id: editingGoal.id, ...(data as unknown as Record<string, unknown>) });
    } else {
      await createGoal.mutateAsync(data as unknown as Record<string, unknown>);
    }
    setShowModal(false);
    setEditingGoal(null);
  }

  function openEdit(goal: GoalRow) {
    setEditingGoal(goal);
    setShowModal(true);
  }

  function openAdd() {
    setEditingGoal(null);
    setShowModal(true);
  }

  async function handleDelete(id: string) {
    await deleteGoal.mutateAsync(id);
  }

  return (
    <div className="space-y-6">
      {/* Header metrics */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricCard
          label="Active Goals"
          value={String(activeGoals.length)}
          sub={`${goals.length} total`}
          trend="neutral"
        />
        <MetricCard
          label="On Track"
          value={`${onTrackPct}%`}
          sub={`${onTrackCount} of ${activeGoals.length} goals`}
          trend={onTrackPct >= 75 ? "up" : onTrackPct >= 40 ? "neutral" : "down"}
        />
        <MetricCard
          label="Completed"
          value={String(goals.filter((g) => g.isCompleted).length)}
          sub="goals achieved"
          trend="up"
        />
        <MetricCard
          label="Behind Schedule"
          value={String(activeGoals.length - onTrackCount)}
          sub="need attention"
          trend={activeGoals.length - onTrackCount > 0 ? "down" : "up"}
        />
      </div>

      {/* Add goal button */}
      <div className="flex justify-end">
        <button
          onClick={openAdd}
          className="bg-foreground text-background rounded-md px-3 py-1.5 text-sm font-medium hover:bg-foreground/90 transition-colors flex items-center gap-1.5"
        >
          <Plus className="h-3.5 w-3.5" />
          Add goal
        </button>
      </div>

      {/* Goal grid */}
      {isLoading ? (
        <div className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">
          Loading goals...
        </div>
      ) : goals.length === 0 ? (
        <div className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">
          No goals yet.{" "}
          <button onClick={openAdd} className="underline hover:no-underline">
            Add your first goal
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} onEdit={openEdit} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <GoalModal
          onClose={() => { setShowModal(false); setEditingGoal(null); }}
          onSubmit={handleSubmit}
          isLoading={createGoal.isPending || updateGoal.isPending}
          initialData={editingGoal}
          assets={assets}
        />
      )}
    </div>
  );
}
