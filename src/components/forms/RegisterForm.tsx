"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";

const CURRENCIES = ["COP", "USD", "EUR", "MXN", "CRC", "GBP"];

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { baseCurrency: "COP" },
  });

  async function onSubmit(data: RegisterInput) {
    setError(null);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const body = await res.json();
        const msgs = Object.values(body.error ?? {}).flat().join(". ");
        setError(msgs || "Registration failed");
        return;
      }

      await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-1.5 block" htmlFor="name">
          Full name
        </label>
        <input
          id="name"
          type="text"
          autoComplete="name"
          placeholder="Rafael Sanchez"
          className="w-full h-9 px-3 rounded-md border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          {...register("name")}
        />
        {errors.name && (
          <p className="text-destructive text-xs mt-1">{errors.name.message}</p>
        )}
      </div>

      <div>
        <label className="text-sm font-medium mb-1.5 block" htmlFor="reg-email">
          Email
        </label>
        <input
          id="reg-email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          className="w-full h-9 px-3 rounded-md border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          {...register("email")}
        />
        {errors.email && (
          <p className="text-destructive text-xs mt-1">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label className="text-sm font-medium mb-1.5 block" htmlFor="reg-password">
          Password
        </label>
        <input
          id="reg-password"
          type="password"
          autoComplete="new-password"
          placeholder="Min. 8 chars, 1 uppercase, 1 number"
          className="w-full h-9 px-3 rounded-md border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          {...register("password")}
        />
        {errors.password && (
          <p className="text-destructive text-xs mt-1">{errors.password.message}</p>
        )}
      </div>

      <div>
        <label className="text-sm font-medium mb-1.5 block" htmlFor="baseCurrency">
          Base currency
        </label>
        <select
          id="baseCurrency"
          className="w-full h-9 px-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          {...register("baseCurrency")}
        >
          {CURRENCIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full h-9 bg-foreground text-background rounded-md text-sm font-medium hover:bg-foreground/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}
