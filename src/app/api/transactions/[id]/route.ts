import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { transactionUpdateSchema } from "@/lib/validations/transaction";
import { updateTransaction } from "@/services/transaction";

type Params = Promise<{ id: string }>;

export async function PATCH(req: NextRequest, { params }: { params: Params }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const parsed = transactionUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }
  try {
    const baseCurrency = session.user.baseCurrency ?? "COP";
    const transaction = await updateTransaction(session.user!.id!, baseCurrency, id, parsed.data);
    return NextResponse.json({ transaction });
  } catch (e: any) {
    if (e.message === "Transaction not found")
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    throw e;
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Params }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const tx = await prisma.transaction.findFirst({ where: { id, userId: session.user!.id! } });
  if (!tx) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.transaction.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

export async function GET(_req: NextRequest, { params }: { params: Params }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const tx = await prisma.transaction.findFirst({
    where: { id, userId: session.user!.id! },
    include: { category: true, creditCard: true },
  });
  if (!tx) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ transaction: tx });
}
