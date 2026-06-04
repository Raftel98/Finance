import { NextRequest, NextResponse } from "next/server";
import argon2 from "argon2";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, email, password, baseCurrency } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: { email: ["Email already in use"] } },
        { status: 409 }
      );
    }

    const passwordHash = await argon2.hash(password);

    const user = await prisma.user.create({
      data: { name, email, passwordHash, baseCurrency },
      select: { id: true, email: true, name: true, baseCurrency: true },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "CREATE",
        entity: "USER",
        entityId: user.id,
        ipAddress: req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? undefined,
        userAgent: req.headers.get("user-agent") ?? undefined,
      },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    console.error("[register]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
