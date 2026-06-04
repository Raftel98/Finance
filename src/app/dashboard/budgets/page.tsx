import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { PageShell } from "@/components/ui/PageShell";
import { BudgetsClient } from "@/components/modules/budgets/BudgetsClient";

export const metadata: Metadata = { title: "Budgets" };

export default async function BudgetsPage() {
  const session = await auth();
  const baseCurrency = session!.user.baseCurrency ?? "COP";

  return (
    <PageShell title="Budgets">
      <BudgetsClient baseCurrency={baseCurrency} />
    </PageShell>
  );
}
