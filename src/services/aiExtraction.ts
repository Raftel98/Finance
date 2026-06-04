import type { ExtractedTransaction } from "@/types/ai";
export type { ExtractedTransaction } from "@/types/ai";

const SYSTEM_PROMPT = `Extract all financial transactions from this document. For each transaction return a JSON array with:
- date (YYYY-MM-DD)
- description (string)
- merchant (string, if identifiable)
- amount (number, always positive)
- currency (3-letter code, default to COP if unclear)
- type ("INCOME" or "EXPENSE")
- suggestedCategory (string, one of: Salary, Housing, Food & dining, Transport, Entertainment, Healthcare, Education, Shopping, Utilities, Other)
- confidence (0-1)

Return ONLY a valid JSON array. No markdown, no explanation.`;

const MOCK_EXTRACTIONS: ExtractedTransaction[] = [
  {
    date: new Date().toISOString().slice(0, 10),
    description: "Salary deposit",
    merchant: "Employer",
    amount: 5000000,
    currency: "COP",
    type: "INCOME",
    suggestedCategory: "Salary",
    confidence: 0.95,
  },
  {
    date: new Date().toISOString().slice(0, 10),
    description: "Grocery purchase",
    merchant: "Exito",
    amount: 85000,
    currency: "COP",
    type: "EXPENSE",
    suggestedCategory: "Food & dining",
    confidence: 0.88,
  },
  {
    date: new Date().toISOString().slice(0, 10),
    description: "Electricity bill",
    merchant: "EPM",
    amount: 120000,
    currency: "COP",
    type: "EXPENSE",
    suggestedCategory: "Utilities",
    confidence: 0.92,
  },
];

export async function extractFromFile(
  file: Buffer,
  mimeType: string,
  filename: string
): Promise<ExtractedTransaction[]> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.warn("[aiExtraction] OPENAI_API_KEY not set — returning mock data");
    return MOCK_EXTRACTIONS;
  }

  const base64 = file.toString("base64");
  const isImage = mimeType.startsWith("image/");
  const isPdf = mimeType === "application/pdf";

  let messages: unknown[];

  if (isImage) {
    messages = [
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: { url: `data:${mimeType};base64,${base64}` },
          },
          { type: "text", text: SYSTEM_PROMPT },
        ],
      },
    ];
  } else if (isPdf) {
    // GPT-4o can handle PDFs via file uploads API, but for simplicity use base64 image approach
    // For PDFs we send as a file content message
    messages = [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `${SYSTEM_PROMPT}\n\n[Document: ${filename} — PDF content encoded below]\nBase64: ${base64.slice(0, 1000)}...`,
          },
        ],
      },
    ];
  } else {
    messages = [
      {
        role: "user",
        content: `${SYSTEM_PROMPT}\n\n[Document: ${filename}]`,
      },
    ];
  }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a financial document parser. Extract transactions and return only JSON." },
        ...messages,
      ],
      max_tokens: 4096,
      temperature: 0,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("[aiExtraction] OpenAI error:", err);
    throw new Error(`OpenAI API error: ${res.status}`);
  }

  const json = await res.json();
  const content = json.choices?.[0]?.message?.content ?? "[]";

  try {
    const parsed = JSON.parse(content);
    if (!Array.isArray(parsed)) throw new Error("Not an array");
    return parsed as ExtractedTransaction[];
  } catch {
    console.error("[aiExtraction] Failed to parse response:", content);
    throw new Error("Failed to parse extraction response");
  }
}
