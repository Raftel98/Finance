import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { extractFromFile } from "@/services/aiExtraction";
import { randomUUID } from "crypto";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user!.id!;

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const MAX_SIZE = 25 * 1024 * 1024; // 25MB
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "File too large (max 25MB)" }, { status: 413 });
  }

  const mimeType = file.type;
  const filename = file.name;
  const storageKey = `memory-${randomUUID()}`;

  // Create document record
  const document = await prisma.uploadedDocument.create({
    data: {
      userId,
      filename,
      mimeType,
      fileSize: file.size,
      storageKey,
      status: "PROCESSING",
      documentType: filename.toLowerCase().includes("card") ? "CARD_STATEMENT" : "BANK_STATEMENT",
    },
  });

  // Create extraction record
  const extraction = await prisma.aiExtraction.create({
    data: {
      documentId: document.id,
      status: "PENDING",
    },
  });

  // Run extraction
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const extracted = await extractFromFile(buffer, mimeType, filename);

    await prisma.aiExtraction.update({
      where: { id: extraction.id },
      data: {
        status: "COMPLETED",
        extractedTransactions: extracted as any,
        processingModel: "gpt-4o",
      },
    });

    await prisma.uploadedDocument.update({
      where: { id: document.id },
      data: { status: "EXTRACTED" },
    });

    return NextResponse.json({
      documentId: document.id,
      extractionId: extraction.id,
      extractions: extracted,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";

    await prisma.aiExtraction.update({
      where: { id: extraction.id },
      data: { status: "FAILED", errorMessage: msg },
    });
    await prisma.uploadedDocument.update({
      where: { id: document.id },
      data: { status: "FAILED" },
    });

    return NextResponse.json({ error: `Extraction failed: ${msg}` }, { status: 500 });
  }
}
