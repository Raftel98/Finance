import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { goalUpdateSchema } from "@/lib/validations/goal";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user!.id!;
  const { id } = await params;

  const goal = await prisma.financialGoal.findUnique({ where: { id } });
  if (!goal || goal.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = goalUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const data = parsed.data;

  const updated = await prisma.financialGoal.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.targetAmount !== undefined && { targetAmount: data.targetAmount }),
      ...(data.currency !== undefined && { currency: data.currency }),
      ...(data.deadline !== undefined && {
        deadline: data.deadline ? new Date(data.deadline) : null,
      }),
      ...(data.trackingType !== undefined && { trackingType: data.trackingType }),
      ...(data.assetId !== undefined && { assetId: data.assetId ?? null }),
      ...(data.currentAmount !== undefined && { currentAmount: data.currentAmount }),
      ...(data.notes !== undefined && { notes: data.notes ?? null }),
    },
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

  const goal = await prisma.financialGoal.findUnique({ where: { id } });
  if (!goal || goal.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.financialGoal.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
