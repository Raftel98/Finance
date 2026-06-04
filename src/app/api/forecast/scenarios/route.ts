import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { scenarioSchema } from "@/lib/validations/forecast";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const scenarios = await prisma.forecastScenario.findMany({
    where: { userId: session.user!.id! },
    include: { adjustments: true },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ scenarios });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = scenarioSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const scenario = await prisma.forecastScenario.create({
    data: { ...parsed.data, userId: session.user!.id! },
    include: { adjustments: true },
  });

  return NextResponse.json({ scenario }, { status: 201 });
}
