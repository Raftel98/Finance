import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageShell } from "@/components/ui/PageShell";
import { GoalsClient } from "@/components/modules/goals/GoalsClient";

export const metadata: Metadata = { title: "Goals" };

export default async function GoalsPage() {
  const session = await auth();
  const userId = session!.user!.id!;

  const assets = await prisma.asset.findMany({
    where: { userId },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <PageShell title="Goals">
      <GoalsClient assets={assets} />
    </PageShell>
  );
}
