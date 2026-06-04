import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recurringRuleSchema } from "@/lib/validations/recurring";
import { addMonths, addWeeks, addDays, addYears } from "date-fns";

function computeNextOccurrence(
  frequency: string,
  startDate: Date,
  dayOfMonth?: number | null
): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let next = new Date(startDate);

  while (next <= today) {
    switch (frequency) {
      case "DAILY":   next = addDays(next, 1); break;
      case "WEEKLY":  next = addWeeks(next, 1); break;
      case "MONTHLY": next = addMonths(next, 1); break;
      case "YEARLY":  next = addYears(next, 1); break;
    }
  }

  if (frequency === "MONTHLY" && dayOfMonth) {
    next.setDate(Math.min(dayOfMonth, new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate()));
  }

  return next;
}

// GET /api/recurring-rules
export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rules = await prisma.recurringRule.findMany({
    where: { userId: session.user!.id! },
    include: { category: true },
    orderBy: [{ isActive: "desc" }, { nextOccurrence: "asc" }],
  });

  return NextResponse.json({ rules });
}

// POST /api/recurring-rules
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = recurringRuleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { startDate, frequency, dayOfMonth, endDate, ...rest } = parsed.data;
  const start = new Date(startDate);
  const nextOccurrence = computeNextOccurrence(frequency, start, dayOfMonth);

  const rule = await prisma.recurringRule.create({
    data: {
      ...rest,
      userId: session.user!.id!,
      frequency,
      startDate: start,
      endDate: endDate ? new Date(endDate) : null,
      dayOfMonth: dayOfMonth ?? null,
      nextOccurrence,
    },
    include: { category: true },
  });

  return NextResponse.json({ rule }, { status: 201 });
}
