import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const profileSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  email: z.string().email().optional(),
});

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user!.id!;
  const body = await req.json();
  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { name, email } = parsed.data;

  if (email) {
    const existing = await prisma.user.findFirst({ where: { email, NOT: { id: userId } } });
    if (existing) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    }
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { ...(name !== undefined && { name }), ...(email !== undefined && { email }) },
    select: { id: true, name: true, email: true, baseCurrency: true },
  });

  return NextResponse.json({ user });
}
