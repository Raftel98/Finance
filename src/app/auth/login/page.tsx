import type { Metadata } from "next";
import { LoginForm } from "@/components/forms/LoginForm";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-foreground text-background font-semibold text-sm mb-3">
            PW
          </div>
          <h1 className="text-xl font-medium">Personal Wealth OS</h1>
          <p className="text-sm text-muted-foreground mt-1">Sign in to your account</p>
        </div>
        <div className="bg-card border rounded-xl p-6 shadow-sm">
          <LoginForm />
        </div>
        <p className="text-center text-sm text-muted-foreground mt-4">
          No account?{" "}
          <a href="/auth/register" className="text-foreground underline underline-offset-4 hover:text-foreground/80">
            Create one
          </a>
        </p>
      </div>
    </div>
  );
}
