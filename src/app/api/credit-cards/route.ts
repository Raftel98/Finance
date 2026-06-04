import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { creditCardSchema } from "@/lib/validations/creditCard";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user!.id!;

  const cards = await prisma.creditCard.findMany({
    where: { userId },
    include: {
      liability: { select: { id: true, balance: true } },
      transactions: {
        select: { amount: true, type: true },
        where: { type: "EXPENSE" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const enriched = cards.map((card) => {
    // Use linked liability balance if present, otherwise sum transactions
    let currentBalance = 0;
    if (card.liability) {
      currentBalance = Number(card.liability.balance);
    } else {
      currentBalance = card.transactions.reduce(
        (sum, t) => sum + Number(t.amount),
        0
      );
    }

    const creditLimit = Number(card.creditLimit);
    const utilization = creditLimit > 0 ? (currentBalance / creditLimit) * 100 : 0;
    const available = creditLimit - currentBalance;

    return {
      id: card.id,
      name: card.name,
      issuer: card.issuer,
      creditLimit,
      currency: card.currency,
      closingDay: card.closingDay,
      paymentDay: card.paymentDay,
      color: card.color,
      icon: card.icon,
      isActive: card.isActive,
      createdAt: card.createdAt,
      currentBalance,
      utilization,
      available,
      liabilityId: card.liability?.id ?? null,
    };
  });

  const totalLimit = enriched.reduce((s, c) => s + c.creditLimit, 0);
  const totalBalance = enriched.reduce((s, c) => s + c.currentBalance, 0);
  const totalAvailable = totalLimit - totalBalance;
  const overallUtilization = totalLimit > 0 ? (totalBalance / totalLimit) * 100 : 0;

  return NextResponse.json({
    cards: enriched,
    totals: { totalLimit, totalBalance, totalAvailable, overallUtilization },
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user!.id!;

  const body = await req.json();
  const parsed = creditCardSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const card = await prisma.creditCard.create({
    data: { ...parsed.data, userId },
  });

  return NextResponse.json(card, { status: 201 });
}
