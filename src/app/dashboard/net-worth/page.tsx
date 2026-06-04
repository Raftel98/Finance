import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { PageShell } from "@/components/ui/PageShell";
import { NetWorthClient } from "@/components/modules/net-worth/NetWorthClient";
import { getNetWorthHistory } from "@/services/netWorth";

export const metadata: Metadata = { title: "Net Worth" };

export default async function NetWorthPage() {
  const session = await auth();
  const userId = session!.user!.id!;
  const baseCurrency = (session!.user as any).baseCurrency ?? "COP";

  const history = await getNetWorthHistory(userId, 12);

  const serializedHistory = history.map((s) => ({
    ...s,
    totalAssets: Number(s.totalAssets),
    totalLiabilities: Number(s.totalLiabilities),
    netWorth: Number(s.netWorth),
    snapshotDate: s.snapshotDate.toISOString(),
    createdAt: s.createdAt.toISOString(),
  }));

  const current =
    serializedHistory.length > 0
      ? serializedHistory[serializedHistory.length - 1]
      : null;
  const previous =
    serializedHistory.length > 1
      ? serializedHistory[serializedHistory.length - 2]
      : null;

  const momChange =
    current && previous ? current.netWorth - previous.netWorth : null;
  const momChangePct =
    momChange != null && previous && previous.netWorth !== 0
      ? (momChange / Math.abs(previous.netWorth)) * 100
      : null;

  return (
    <PageShell title="Net Worth">
      <NetWorthClient
        initialData={{
          current: current ? { ...current, momChange, momChangePct } : null,
          history: serializedHistory as any,
          baseCurrency,
        }}
      />
    </PageShell>
  );
}
