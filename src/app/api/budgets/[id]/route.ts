import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { budgetUpdateSchema } from "@/lib/validations/budget";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user!.id!;
  const { id } = await params;

  const budget = await prisma.budget.findUnique({ where: { id } });
  if (!budget || budget.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = budgetUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const updated = await prisma.budget.update({
    where: { id },
    data: {
      ...parsed.data,
      month: parsed.data.month ?? null,
      notes: parsed.data.notes ?? null,
    },
    include: { category: true },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user!.id!;
  const { id } = await params;

  const budget = await prisma.budget.findUnique({ where: { id } });
  if (!budget || budget.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.budget.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
