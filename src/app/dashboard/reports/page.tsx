import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { PageShell } from "@/components/ui/PageShell";
import { ReportsClient } from "@/components/modules/reports/ReportsClient";

export const metadata: Metadata = { title: "Reports" };

export default async function ReportsPage() {
  const session = await auth();
  const baseCurrency = session!.user.baseCurrency ?? "COP";
  return (
    <PageShell title="Reports">
      <ReportsClient baseCurrency={baseCurrency} />
    </PageShell>
  );
}
