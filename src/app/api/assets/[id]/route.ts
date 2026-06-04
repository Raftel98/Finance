import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assetUpdateSchema } from "@/lib/validations/asset";

async function getAssetOrFail(id: string, userId: string) {
  const asset = await prisma.asset.findUnique({ where: { id } });
  if (!asset || asset.userId !== userId) return null;
  return asset;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const asset = await getAssetOrFail(id, session.user!.id!);
  if (!asset) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(asset);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const existing = await getAssetOrFail(id, session.user!.id!);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = assetUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const { purchaseDate, ...rest } = parsed.data;
  const updated = await prisma.asset.update({
    where: { id },
    data: {
      ...rest,
      ...(purchaseDate !== undefined
        ? { purchaseDate: purchaseDate ? new Date(purchaseDate) : null }
        : {}),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const existing = await getAssetOrFail(id, session.user!.id!);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.asset.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
