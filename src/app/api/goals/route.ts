import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { goalSchema } from "@/lib/validations/goal";
import { getGoalsWithProgress } from "@/services/goal";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user!.id!;
  const goals = await getGoalsWithProgress(userId);
  return NextResponse.json(goals);
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

  const parsed = goalSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const data = parsed.data;

  const goal = await prisma.financialGoal.create({
    data: {
      userId,
      name: data.name,
      targetAmount: data.targetAmount,
      currency: data.currency,
      deadline: data.deadline ? new Date(data.deadline) : null,
      trackingType: data.trackingType,
      assetId: data.assetId ?? null,
      currentAmount: data.currentAmount ?? 0,
      notes: data.notes ?? null,
      isCompleted: false,
    },
  });

  return NextResponse.json(goal, { status: 201 });
}
