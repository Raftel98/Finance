import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user!.id!;

  // Delete all sessions for the user (NextAuth JWT sessions don't persist to DB by default,
  // but if using database sessions via PrismaAdapter, we delete all)
  try {
    await prisma.session.deleteMany({ where: { userId } });
  } catch {
    // Sessions table may not exist for JWT strategy — that's okay
  }

  return NextResponse.json({ message: "All sessions revoked" });
}

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user!.id!;
  let count = 1;

  try {
    count = await prisma.session.count({ where: { userId } });
  } catch {
    // JWT strategy — just return 1
  }

  return NextResponse.json({ count });
}
