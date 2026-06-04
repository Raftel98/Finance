import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import argon2 from "argon2";

const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user!.id!;
  const body = await req.json();
  const parsed = passwordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.passwordHash) {
    return NextResponse.json({ error: "Password not set" }, { status: 400 });
  }

  const valid = await argon2.verify(user.passwordHash, parsed.data.currentPassword);
  if (!valid) {
    return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 });
  }

  const newHash = await argon2.hash(parsed.data.newPassword);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash: newHash } });

  return NextResponse.json({ message: "Password updated" });
}
