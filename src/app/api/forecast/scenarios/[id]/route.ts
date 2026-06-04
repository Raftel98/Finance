import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { scenarioSchema, adjustmentSchema } from "@/lib/validations/forecast";

async function getOwned(id: string, userId: string) {
  return prisma.forecastScenario.findFirst({ where: { id, userId }, include: { adjustments: true } });
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const scenario = await getOwned(id, session.user!.id!);
  if (!scenario) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ scenario });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const existing = await getOwned(id, session.user!.id!);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = scenarioSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const scenario = await prisma.forecastScenario.update({
    where: { id },
    data: parsed.data,
    include: { adjustments: true },
  });

  return NextResponse.json({ scenario });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const existing = await getOwned(id, session.user!.id!);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.forecastScenario.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}

// POST /api/forecast/scenarios/[id]/adjustments — handled inline via URL detection
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const existing = await getOwned(id, session.user!.id!);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = adjustmentSchema.safeParse({ ...body, scenarioId: id });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { scenarioId, startDate, endDate, ...rest } = parsed.data;
  const adjustment = await prisma.scenarioAdjustment.create({
    data: {
      ...rest,
      scenarioId: id,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
    },
  });

  return NextResponse.json({ adjustment }, { status: 201 });
}
