"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(data: LoginInput) {
    setError(null);
    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-1.5 block" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          className="w-full h-9 px-3 rounded-md border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
          {...register("email")}
        />
        {errors.email && (
          <p className="text-destructive text-xs mt-1">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label className="text-sm font-medium mb-1.5 block" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          className="w-full h-9 px-3 rounded-md border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
          {...register("password")}
        />
        {errors.password && (
          <p className="text-destructive text-xs mt-1">{errors.password.message}</p>
        )}
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
        {isSubmitting ? "Signing in…" : "Sign in"}
      </button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-card px-2 text-muted-foreground">demo account</span>
        </div>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        <code className="bg-muted px-1.5 py-0.5 rounded text-xs">demo@pwos.app</code>{" "}
        /{" "}
        <code className="bg-muted px-1.5 py-0.5 rounded text-xs">demo123456</code>
      </p>
    </form>
  );
}
