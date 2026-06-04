import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { PageShell } from "@/components/ui/PageShell";
import { ForecastClient } from "@/components/modules/forecast/ForecastClient";

export const metadata: Metadata = { title: "Forecast" };

export default async function ForecastPage() {
  const session = await auth();
  const baseCurrency = (session!.user as any).baseCurrency ?? "COP";
  return (
    <PageShell title="Forecast">
      <ForecastClient baseCurrency={baseCurrency} />
    </PageShell>
  );
}
