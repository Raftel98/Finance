import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { budgetSchema } from "@/lib/validations/budget";
import { getBudgetsWithActuals } from "@/services/budget";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user!.id!;
  const baseCurrency = (session.user as any).baseCurrency ?? "COP";

  const { searchParams } = request.nextUrl;
  const year = searchParams.get("year") ? Number(searchParams.get("year")) : new Date().getFullYear();
  const month = searchParams.get("month") ? Number(searchParams.get("month")) : undefined;

  const budgets = await getBudgetsWithActuals(userId, baseCurrency, year, month);
  return NextResponse.json(budgets);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user!.id!;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = budgetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const data = parsed.data;

  // Check uniqueness
  const existing = await prisma.budget.findFirst({
    where: {
      userId,
      categoryId: data.categoryId,
      period: data.period,
      year: data.year,
      month: data.month ?? null,
    },
  });

  if (existing) {
    return NextResponse.json(
      { error: "A budget for this category and period already exists" },
      { status: 409 }
    );
  }

  const budget = await prisma.budget.create({
    data: {
      userId,
      categoryId: data.categoryId,
      period: data.period,
      year: data.year,
      month: data.month ?? null,
      projectedAmount: data.projectedAmount,
      currency: data.currency,
      notes: data.notes ?? null,
    },
    include: { category: true },
  });

  return NextResponse.json(budget, { status: 201 });
}
