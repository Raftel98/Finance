import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { PageShell } from "@/components/ui/PageShell";
import { TransactionsClient } from "@/components/modules/transactions/TransactionsClient";

export const metadata: Metadata = { title: "Transactions" };

export default async function TransactionsPage() {
  const session = await auth();
  const baseCurrency = (session!.user as any).baseCurrency ?? "COP";
  return (
    <PageShell title="Transactions">
      <TransactionsClient baseCurrency={baseCurrency} />
    </PageShell>
  );
}
