import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recurringRuleSchema } from "@/lib/validations/recurring";

// PATCH /api/recurring-rules/:id
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rule = await prisma.recurringRule.findFirst({
    where: { id: params.id, userId: session.user!.id! },
  });
  if (!rule) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = recurringRuleSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const updates: any = { ...parsed.data };
  if (parsed.data.startDate) updates.startDate = new Date(parsed.data.startDate);
  if (parsed.data.endDate) updates.endDate = new Date(parsed.data.endDate);

  const updated = await prisma.recurringRule.update({
    where: { id: params.id },
    data: updates,
    include: { category: true },
  });
  return NextResponse.json({ rule: updated });
}

// DELETE /api/recurring-rules/:id
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rule = await prisma.recurringRule.findFirst({
    where: { id: params.id, userId: session.user!.id! },
  });
  if (!rule) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.recurringRule.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
