import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { categorySchema } from "@/lib/validations/transaction";

// GET /api/categories — returns system + user categories
export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const categories = await prisma.category.findMany({
    where: {
      OR: [{ isSystem: true }, { userId: session.user!.id! }],
    },
    orderBy: [{ isSystem: "desc" }, { name: "asc" }],
  });

  return NextResponse.json({ categories });
}

// POST /api/categories — create user category
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = categorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const category = await prisma.category.create({
    data: { ...parsed.data, userId: session.user!.id! },
  });

  return NextResponse.json({ category }, { status: 201 });
}
