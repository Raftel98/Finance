import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { categorySchema } from "@/lib/validations/transaction";

// PATCH /api/categories/:id
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const category = await prisma.category.findFirst({
    where: { id: params.id, userId: session.user!.id! },
  });
  if (!category) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = categorySchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const updated = await prisma.category.update({
    where: { id: params.id },
    data: parsed.data,
  });
  return NextResponse.json({ category: updated });
}

// DELETE /api/categories/:id
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const category = await prisma.category.findFirst({
    where: { id: params.id, userId: session.user!.id!, isSystem: false },
  });
  if (!category) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.category.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
