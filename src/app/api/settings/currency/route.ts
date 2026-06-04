import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { SUPPORTED_CURRENCIES } from "@/lib/constants";

const currencySchema = z.object({
  baseCurrency: z.enum(SUPPORTED_CURRENCIES),
});

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = currencySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: session.user!.id! },
    data: { baseCurrency: parsed.data.baseCurrency },
    select: { id: true, baseCurrency: true },
  });

  return NextResponse.json({ user });
}
