import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generateCSV } from "@/services/report";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user!.id!;
  const baseCurrency = (session.user as any).baseCurrency ?? "COP";

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") ?? "MONTHLY";
  const year = Number(searchParams.get("year") ?? new Date().getFullYear());
  const month = searchParams.get("month") ? Number(searchParams.get("month")) : undefined;
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  let start: Date;
  let end: Date;

  if (from && to) {
    start = new Date(from);
    end = new Date(to);
  } else if (type === "MONTHLY" && month !== undefined) {
    start = new Date(year, month - 1, 1);
    end = new Date(year, month, 0, 23, 59, 59);
  } else if (type === "ANNUAL") {
    start = new Date(year, 0, 1);
    end = new Date(year, 11, 31, 23, 59, 59);
  } else {
    // default to current year
    start = new Date(year, 0, 1);
    end = new Date(year, 11, 31, 23, 59, 59);
  }

  const csv = await generateCSV(userId, baseCurrency, start, end);

  const filename = `transactions-${type.toLowerCase()}-${year}${month ? `-${String(month).padStart(2, "0")}` : ""}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
