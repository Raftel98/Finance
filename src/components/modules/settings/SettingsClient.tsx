"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, CheckCircle2, AlertCircle, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { SUPPORTED_CURRENCIES, CURRENCY_LABELS } from "@/lib/constants";

const TABS = ["Profile", "Currency", "Security", "Data"] as const;
type Tab = (typeof TABS)[number];

const profileSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Required"),
    newPassword: z.string().min(8, "At least 8 characters"),
    confirmPassword: z.string().min(1, "Required"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

interface Props {
  initialName: string;
  initialEmail: string;
  initialCurrency: string;
}

type FeedbackState = { type: "success" | "error"; message: string } | null;

function useFeedback() {
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const show = (type: "success" | "error", message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };
  return { feedback, show };
}

export function SettingsClient({ initialName, initialEmail, initialCurrency }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("Profile");

  return (
    <div className="max-w-2xl space-y-6">
      {/* Tab navigation */}
      <div className="flex rounded-lg border overflow-hidden w-fit">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-4 py-2 text-sm font-medium transition-colors",
              activeTab === tab
                ? "bg-foreground text-background"
                : "hover:bg-muted text-muted-foreground"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "Profile" && (
        <ProfileTab initialName={initialName} initialEmail={initialEmail} />
      )}
      {activeTab === "Currency" && (
        <CurrencyTab initialCurrency={initialCurrency} />
      )}
      {activeTab === "Security" && <SecurityTab />}
      {activeTab === "Data" && <DataTab />}
    </div>
  );
}

function Feedback({ state }: { state: FeedbackState }) {
  if (!state) return null;
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg p-3 text-sm",
        state.type === "success"
          ? "bg-green-50 border border-green-200 text-green-700"
          : "bg-destructive/10 border border-destructive/20 text-destructive"
      )}
    >
      {state.type === "success" ? (
        <CheckCircle2 className="h-4 w-4 shrink-0" />
      ) : (
        <AlertCircle className="h-4 w-4 shrink-0" />
      )}
      {state.message}
    </div>
  );
}

function ProfileTab({ initialName, initialEmail }: { initialName: string; initialEmail: string }) {
  const { feedback, show } = useFeedback();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: initialName, email: initialEmail },
  });

  async function onSubmit(values: z.infer<typeof profileSchema>) {
    try {
      const res = await fetch("/api/settings/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const err = await res.json();
        show("error", err.error ?? "Update failed");
      } else {
        show("success", "Profile updated successfully");
      }
    } catch {
      show("error", "Network error");
    }
  }

  return (
    <div className="rounded-xl border bg-card p-6 space-y-4">
      <div>
        <h2 className="text-base font-semibold">Profile</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Update your name and email address</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="text-sm font-medium block mb-1.5">Name</label>
          <input
            {...register("name")}
            className="w-full h-9 px-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {errors.name && <p className="text-xs text-destructive mt-1">{errors.name.message}</p>}
        </div>

        <div>
          <label className="text-sm font-medium block mb-1.5">Email</label>
          <input
            {...register("email")}
            type="email"
            className="w-full h-9 px-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
        </div>

        <Feedback state={feedback} />

        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-foreground text-background rounded-md px-4 py-2 text-sm font-medium hover:bg-foreground/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Save changes
        </button>
      </form>
    </div>
  );
}

function CurrencyTab({ initialCurrency }: { initialCurrency: string }) {
  const { feedback, show } = useFeedback();
  const [currency, setCurrency] = useState(initialCurrency);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/settings/currency", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ baseCurrency: currency }),
      });
      if (!res.ok) {
        show("error", "Failed to update currency");
      } else {
        show("success", "Base currency updated. Refresh the page to see changes.");
      }
    } catch {
      show("error", "Network error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl border bg-card p-6 space-y-4">
      <div>
        <h2 className="text-base font-semibold">Base Currency</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          All amounts will be converted and displayed in your base currency. Changing this affects
          dashboard totals, net worth calculations, and reports.
        </p>
      </div>

      <div>
        <label className="text-sm font-medium block mb-1.5">Currency</label>
        <select
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          className="w-full h-9 px-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {SUPPORTED_CURRENCIES.map((c) => (
            <option key={c} value={c}>
              {c} — {CURRENCY_LABELS[c]}
            </option>
          ))}
        </select>
      </div>

      <Feedback state={feedback} />

      <button
        onClick={handleSave}
        disabled={saving}
        className="bg-foreground text-background rounded-md px-4 py-2 text-sm font-medium hover:bg-foreground/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
      >
        {saving && <Loader2 className="h-4 w-4 animate-spin" />}
        Save currency
      </button>
    </div>
  );
}

function SecurityTab() {
  const { feedback, show } = useFeedback();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  async function onSubmit(values: z.infer<typeof passwordSchema>) {
    try {
      const res = await fetch("/api/settings/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        show("error", err.error ?? "Failed to update password");
      } else {
        show("success", "Password updated successfully");
        reset();
      }
    } catch {
      show("error", "Network error");
    }
  }

  return (
    <div className="rounded-xl border bg-card p-6 space-y-4">
      <div>
        <h2 className="text-base font-semibold">Change Password</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Update your account password</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="text-sm font-medium block mb-1.5">Current Password</label>
          <input
            {...register("currentPassword")}
            type="password"
            className="w-full h-9 px-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {errors.currentPassword && (
            <p className="text-xs text-destructive mt-1">{errors.currentPassword.message}</p>
          )}
        </div>

        <div>
          <label className="text-sm font-medium block mb-1.5">New Password</label>
          <input
            {...register("newPassword")}
            type="password"
            className="w-full h-9 px-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {errors.newPassword && (
            <p className="text-xs text-destructive mt-1">{errors.newPassword.message}</p>
          )}
        </div>

        <div>
          <label className="text-sm font-medium block mb-1.5">Confirm New Password</label>
          <input
            {...register("confirmPassword")}
            type="password"
            className="w-full h-9 px-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {errors.confirmPassword && (
            <p className="text-xs text-destructive mt-1">{errors.confirmPassword.message}</p>
          )}
        </div>

        <Feedback state={feedback} />

        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-foreground text-background rounded-md px-4 py-2 text-sm font-medium hover:bg-foreground/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Update password
        </button>
      </form>
    </div>
  );
}

function DataTab() {
  const [revoking, setRevoking] = useState(false);
  const [revokeFeedback, setRevokeFeedback] = useState<FeedbackState>(null);

  const exportAllUrl = `/api/reports/export?type=ANNUAL&year=2020&to=${new Date().toISOString().slice(0, 10)}&from=2020-01-01`;

  async function handleRevokeAll() {
    setRevoking(true);
    try {
      const res = await fetch("/api/auth/sessions", { method: "DELETE" });
      if (res.ok) {
        setRevokeFeedback({ type: "success", message: "All other sessions signed out" });
      } else {
        setRevokeFeedback({ type: "error", message: "Failed to revoke sessions" });
      }
    } catch {
      setRevokeFeedback({ type: "error", message: "Network error" });
    } finally {
      setRevoking(false);
      setTimeout(() => setRevokeFeedback(null), 4000);
    }
  }

  return (
    <div className="space-y-4">
      {/* Export */}
      <div className="rounded-xl border bg-card p-6 space-y-3">
        <div>
          <h2 className="text-base font-semibold">Export All Data</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Download all your transactions as a CSV file. Includes date, type, amount, category, and more.
          </p>
        </div>
        <a
          href={exportAllUrl}
          download
          className="inline-flex items-center gap-2 bg-foreground text-background rounded-md px-4 py-2 text-sm font-medium hover:bg-foreground/90 transition-colors"
        >
          <Download className="h-4 w-4" /> Export all transactions
        </a>
      </div>

      {/* Sessions */}
      <div className="rounded-xl border bg-card p-6 space-y-3">
        <div>
          <h2 className="text-base font-semibold">Active Sessions</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Sign out all devices except the current one.
          </p>
        </div>

        {revokeFeedback && <Feedback state={revokeFeedback} />}

        <button
          onClick={handleRevokeAll}
          disabled={revoking}
          className="bg-destructive text-destructive-foreground rounded-md px-4 py-2 text-sm font-medium hover:bg-destructive/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {revoking && <Loader2 className="h-4 w-4 animate-spin" />}
          Sign out all devices
        </button>
      </div>
    </div>
  );
}
