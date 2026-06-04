import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const adj = await prisma.scenarioAdjustment.findFirst({
    where: { id },
    include: { scenario: true },
  });
  if (!adj || adj.scenario.userId !== session.user!.id!) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.scenarioAdjustment.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
