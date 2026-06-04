import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { transactionSchema, transactionFilterSchema } from "@/lib/validations/transaction";
import { createTransaction, listTransactions } from "@/services/transaction";

// GET /api/transactions
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const params = Object.fromEntries(req.nextUrl.searchParams);
  const parsed = transactionFilterSchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const result = await listTransactions(session.user!.id!, parsed.data);

  return NextResponse.json({
    ...result,
    transactions: result.transactions.map(serializeTransaction),
  });
}

// POST /api/transactions
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = transactionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const baseCurrency = (session.user as any).baseCurrency ?? "COP";

  const transaction = await createTransaction(session.user!.id!, baseCurrency, parsed.data);

  return NextResponse.json({ transaction: serializeTransaction(transaction) }, { status: 201 });
}

function serializeTransaction(t: any) {
  return {
    ...t,
    amount: Number(t.amount),
    baseAmount: t.baseAmount ? Number(t.baseAmount) : null,
    exchangeRate: t.exchangeRate ? Number(t.exchangeRate) : null,
    date: t.date instanceof Date ? t.date.toISOString().split("T")[0] : t.date,
    exchangeRateDate: t.exchangeRateDate instanceof Date
      ? t.exchangeRateDate.toISOString().split("T")[0]
      : t.exchangeRateDate,
  };
}
