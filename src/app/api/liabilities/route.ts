import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { liabilitySchema } from "@/lib/validations/liability";
import { convert } from "@/services/currency";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user!.id!;
  const baseCurrency = (session.user as any).baseCurrency ?? "COP";

  const [liabilities, creditCards] = await Promise.all([
    prisma.liability.findMany({
      where: { userId },
      include: { creditCard: true },
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
      };
    })
  );

  // Credit utilization across all credit cards
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

  // Find credit card liabilities for utilization
  for (const l of enriched) {
    if (l.type === "CREDIT_CARD") {
      totalCreditUsed += l.baseBalance;
    }
  }

  const creditUtilization =
    totalCreditLimit > 0 ? (totalCreditUsed / totalCreditLimit) * 100 : 0;

  return NextResponse.json({
    liabilities: enriched,
    totals: {
      totalDebt,
      totalMinPayments,
      creditUtilization,
      currency: baseCurrency,
    },
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user!.id!;

  const body = await req.json();
  const parsed = liabilitySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const { dueDate, creditCardId, ...rest } = parsed.data;

  // Validate credit card ownership if provided
  if (creditCardId) {
    const card = await prisma.creditCard.findUnique({ where: { id: creditCardId } });
    if (!card || card.userId !== userId) {
      return NextResponse.json({ error: "Credit card not found" }, { status: 404 });
    }
  }

  const liability = await prisma.liability.create({
    data: {
      ...rest,
      userId,
      dueDate: dueDate ? new Date(dueDate) : null,
      creditCardId: creditCardId ?? null,
    },
  });

  return NextResponse.json(liability, { status: 201 });
}
