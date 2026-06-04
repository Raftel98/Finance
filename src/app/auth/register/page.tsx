import type { Metadata } from "next";
import { RegisterForm } from "@/components/forms/RegisterForm";

export const metadata: Metadata = { title: "Create account" };

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-foreground text-background font-semibold text-sm mb-3">
            PW
          </div>
          <h1 className="text-xl font-medium">Create your account</h1>
          <p className="text-sm text-muted-foreground mt-1">Start tracking your wealth</p>
        </div>
        <div className="bg-card border rounded-xl p-6 shadow-sm">
          <RegisterForm />
        </div>
        <p className="text-center text-sm text-muted-foreground mt-4">
          Already have an account?{" "}
          <a href="/auth/login" className="text-foreground underline underline-offset-4 hover:text-foreground/80">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
