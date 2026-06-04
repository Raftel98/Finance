import { prisma } from "@/lib/prisma";
import { enrichWithBase } from "@/services/currency";
import type { TransactionInput, TransactionFilter } from "@/lib/validations/transaction";
import type { Prisma } from "@prisma/client";

export async function createTransaction(
  userId: string,
  baseCurrency: string,
  input: TransactionInput
) {
  const txDate = new Date(input.date);

  // Compute base amount in user's currency
  const { baseAmount, exchangeRate, exchangeRateDate } = await enrichWithBase(
    input.amount,
    input.currency,
    baseCurrency,
    txDate
  );

  return prisma.transaction.create({
    data: {
      userId,
      type: input.type,
      amount: input.amount,
      currency: input.currency,
      baseAmount,
      exchangeRate,
      exchangeRateDate,
      date: txDate,
      categoryId: input.categoryId ?? null,
      description: input.description ?? null,
      merchant: input.merchant ?? null,
      creditCardId: input.creditCardId ?? null,
      accountId: input.accountId ?? null,
      isRecurring: input.isRecurring ?? false,
      recurringRuleId: input.recurringRuleId ?? null,
      notes: input.notes ?? null,
      source: "MANUAL",
    },
    include: { category: true },
  });
}

export async function updateTransaction(
  userId: string,
  baseCurrency: string,
  id: string,
  input: Partial<TransactionInput>
) {
  // Verify ownership
  const existing = await prisma.transaction.findFirst({ where: { id, userId } });
  if (!existing) throw new Error("Transaction not found");

  const updates: Prisma.TransactionUpdateInput = { ...input };

  // Recompute base amount if amount or currency changed
  if (input.amount !== undefined || input.currency !== undefined) {
    const amount = input.amount ?? Number(existing.amount);
    const currency = input.currency ?? existing.currency;
    const date = input.date ? new Date(input.date) : existing.date;

    const { baseAmount, exchangeRate, exchangeRateDate } = await enrichWithBase(
      amount,
      currency,
      baseCurrency,
      date
    );
    Object.assign(updates, { baseAmount, exchangeRate, exchangeRateDate });
  }

  if (input.date) updates.date = new Date(input.date);

  return prisma.transaction.update({
    where: { id },
    data: updates,
    include: { category: true },
  });
}

export async function listTransactions(userId: string, filter: TransactionFilter) {
  const where: Prisma.TransactionWhereInput = { userId };

  if (filter.type) where.type = filter.type;
  if (filter.categoryId) where.categoryId = filter.categoryId;
  if (filter.currency) where.currency = filter.currency;
  if (filter.from || filter.to) {
    where.date = {};
    if (filter.from) where.date.gte = new Date(filter.from);
    if (filter.to) where.date.lte = new Date(filter.to);
  }
  if (filter.search) {
    where.OR = [
      { description: { contains: filter.search, mode: "insensitive" } },
      { merchant: { contains: filter.search, mode: "insensitive" } },
    ];
  }

  const skip = (filter.page - 1) * filter.limit;

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: { category: true },
      orderBy: { [filter.sortBy]: filter.sortDir },
      skip,
      take: filter.limit,
    }),
    prisma.transaction.count({ where }),
  ]);

  // Summary aggregates
  const [incomeAgg, expenseAgg] = await Promise.all([
    prisma.transaction.aggregate({
      where: { ...where, type: "INCOME" },
      _sum: { baseAmount: true },
    }),
    prisma.transaction.aggregate({
      where: { ...where, type: "EXPENSE" },
      _sum: { baseAmount: true },
    }),
  ]);

  return {
    transactions,
    total,
    pages: Math.ceil(total / filter.limit),
    summary: {
      totalIncome: Number(incomeAgg._sum.baseAmount ?? 0),
      totalExpenses: Number(expenseAgg._sum.baseAmount ?? 0),
    },
  };
}
