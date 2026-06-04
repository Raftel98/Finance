import type { Metadata } from "next";
import { PageShell } from "@/components/ui/PageShell";
import { AIImportClient } from "@/components/modules/ai-import/AIImportClient";

export const metadata: Metadata = { title: "AI Document Import" };

export default function AIImportPage() {
  return (
    <PageShell title="AI Import">
      <AIImportClient />
    </PageShell>
  );
}
