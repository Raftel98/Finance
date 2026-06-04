import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageShell } from "@/components/ui/PageShell";
import { LiabilitiesClient } from "@/components/modules/liabilities/LiabilitiesClient";
import { convert } from "@/services/currency";

export const metadata: Metadata = { title: "Liabilities" };

export default async function LiabilitiesPage() {
  const session = await auth();
  const userId = session!.user!.id!;
  const baseCurrency = session!.user.baseCurrency ?? "COP";

  const [liabilities, creditCards] = await Promise.all([
    prisma.liability.findMany({
      where: { userId },
      include: { creditCard: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.creditCard.findMany({
      where: { userId },
      select: { id: true, creditLimit: true, currency: true },
    }),
  ]);

  let totalDebt = 0;
  let totalMinPayments = 0;
  let totalCreditUsed = 0;
  let totalCreditLimit = 0;

  const enriched = await Promise.all(
    liabilities.map(async (liability) => {
      let baseBalance = Number(liability.balance);
      if (liability.currency !== baseCurrency) {
        try {
          const r = await convert(baseBalance, liability.currency, baseCurrency);
          baseBalance = r.amount;
        } catch {}
      }
      totalDebt += baseBalance;
      if (liability.minimumPayment) totalMinPayments += Number(liability.minimumPayment);

      return {
        ...liability,
        balance: Number(liability.balance),
        interestRate: liability.interestRate ? Number(liability.interestRate) : null,
        minimumPayment: liability.minimumPayment ? Number(liability.minimumPayment) : null,
        baseBalance,
        dueDate: liability.dueDate ? liability.dueDate.toISOString() : null,
        createdAt: liability.createdAt.toISOString(),
        updatedAt: liability.updatedAt.toISOString(),
      };
    })
  );

  for (const card of creditCards) {
    let limit = Number(card.creditLimit);
    if (card.currency !== baseCurrency) {
      try {
        const r = await convert(limit, card.currency, baseCurrency);
        limit = r.amount;
      } catch {}
    }
    totalCreditLimit += limit;
  }

  for (const l of enriched) {
    if (l.type === "CREDIT_CARD") totalCreditUsed += l.baseBalance;
  }

  const creditUtilization =
    totalCreditLimit > 0 ? (totalCreditUsed / totalCreditLimit) * 100 : 0;

  return (
    <PageShell title="Liabilities">
      <LiabilitiesClient
        initialData={{
          liabilities: enriched as any,
          totals: { totalDebt, totalMinPayments, creditUtilization, currency: baseCurrency },
        }}
        baseCurrency={baseCurrency}
      />
    </PageShell>
  );
}
