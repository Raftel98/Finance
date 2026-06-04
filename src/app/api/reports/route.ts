import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateReportData } from "@/services/report";

function getPeriodDates(type: string, year: number, month?: number): { start: Date; end: Date } {
  if (type === "MONTHLY" && month !== undefined) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);
    return { start, end };
  }
  if (type === "QUARTERLY" && month !== undefined) {
    const quarter = Math.ceil(month / 3);
    const start = new Date(year, (quarter - 1) * 3, 1);
    const end = new Date(year, quarter * 3, 0, 23, 59, 59);
    return { start, end };
  }
  // ANNUAL
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31, 23, 59, 59);
  return { start, end };
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user!.id!;
  const baseCurrency = session.user.baseCurrency ?? "COP";

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");

  // If no type param, return list of recent reports
  if (!type) {
    const reports = await prisma.report.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
    });
    return NextResponse.json({ reports });
  }

  const year = Number(searchParams.get("year") ?? new Date().getFullYear());
  const month = searchParams.get("month") ? Number(searchParams.get("month")) : undefined;

  const { start, end } = getPeriodDates(type, year, month);
  const data = await generateReportData(userId, baseCurrency, start, end);

  return NextResponse.json({ report: data });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user!.id!;
  const body = await req.json();
  const { type, year, month, format } = body;

  const { start, end } = getPeriodDates(type ?? "MONTHLY", Number(year), month ? Number(month) : undefined);

  const report = await prisma.report.create({
    data: {
      userId,
      type: type ?? "MONTHLY",
      periodStart: start,
      periodEnd: end,
      format: format ?? "PDF",
      status: "READY",
    },
  });

  return NextResponse.json({ report }, { status: 201 });
}
