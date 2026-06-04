import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { creditCardUpdateSchema } from "@/lib/validations/creditCard";

async function getCardOrFail(id: string, userId: string) {
  const card = await prisma.creditCard.findUnique({ where: { id } });
  if (!card || card.userId !== userId) return null;
  return card;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const card = await getCardOrFail(id, session.user!.id!);
  if (!card) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(card);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const existing = await getCardOrFail(id, session.user!.id!);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = creditCardUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const updated = await prisma.creditCard.update({ where: { id }, data: parsed.data });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const existing = await getCardOrFail(id, session.user!.id!);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.creditCard.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
