import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { liabilityUpdateSchema } from "@/lib/validations/liability";

async function getLiabilityOrFail(id: string, userId: string) {
  const liability = await prisma.liability.findUnique({ where: { id }, include: { creditCard: true } });
  if (!liability || liability.userId !== userId) return null;
  return liability;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const liability = await getLiabilityOrFail(id, session.user!.id!);
  if (!liability) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(liability);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const existing = await getLiabilityOrFail(id, session.user!.id!);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = liabilityUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const { dueDate, ...rest } = parsed.data;
  const updated = await prisma.liability.update({
    where: { id },
    data: {
      ...rest,
      ...(dueDate !== undefined ? { dueDate: dueDate ? new Date(dueDate) : null } : {}),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const existing = await getLiabilityOrFail(id, session.user!.id!);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.liability.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
