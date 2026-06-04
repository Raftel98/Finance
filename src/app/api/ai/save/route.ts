import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { enrichWithBase } from "@/services/currency";

interface TransactionInput {
  date: string;
  description: string;
  merchant: string;
  amount: number;
  currency: string;
  type: "INCOME" | "EXPENSE";
  suggestedCategory: string;
  categoryId?: string | null;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user!.id!;
  const baseCurrency = (session.user as any).baseCurrency ?? "COP";

  const body = await req.json();
  const { documentId, transactions } = body as {
    documentId: string;
    transactions: TransactionInput[];
  };

  if (!documentId || !Array.isArray(transactions) || transactions.length === 0) {
    return NextResponse.json({ error: "documentId and transactions required" }, { status: 400 });
  }

  // Verify document belongs to user
  const doc = await prisma.uploadedDocument.findFirst({ where: { id: documentId, userId } });
  if (!doc) return NextResponse.json({ error: "Document not found" }, { status: 404 });

  // Fetch categories to map suggestedCategory names
  const categories = await prisma.category.findMany({
    where: { OR: [{ isSystem: true }, { userId }] },
  });
  const catMap = new Map(categories.map((c) => [c.name.toLowerCase(), c.id]));

  const created = await Promise.all(
    transactions.map(async (t) => {
      const txDate = new Date(t.date);
      let baseAmount = t.amount;
      let exchangeRate = 1;
      let exchangeRateDate = txDate;

      if (t.currency !== baseCurrency) {
        try {
          const enriched = await enrichWithBase(t.amount, t.currency, baseCurrency, txDate);
          baseAmount = enriched.baseAmount;
          exchangeRate = enriched.exchangeRate;
          exchangeRateDate = enriched.exchangeRateDate;
        } catch {
          // use original amount
        }
      }

      const categoryId =
        t.categoryId ??
        catMap.get(t.suggestedCategory?.toLowerCase()) ??
        null;

      return prisma.transaction.create({
        data: {
          userId,
          type: t.type,
          amount: t.amount,
          currency: t.currency,
          baseAmount,
          exchangeRate,
          exchangeRateDate,
          date: txDate,
          description: t.description || null,
          merchant: t.merchant || null,
          source: "IMPORT",
          categoryId,
        },
      });
    })
  );

  await prisma.uploadedDocument.update({
    where: { id: documentId },
    data: { status: "SAVED" },
  });

  return NextResponse.json({ saved: created.length, transactions: created });
}
