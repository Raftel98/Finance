import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { PageShell } from "@/components/ui/PageShell";
import { SettingsClient } from "@/components/modules/settings/SettingsClient";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const session = await auth();
  const user = session!.user as any;
  return (
    <PageShell title="Settings">
      <SettingsClient
        initialName={user.name ?? ""}
        initialEmail={user.email ?? ""}
        initialCurrency={user.baseCurrency ?? "COP"}
      />
    </PageShell>
  );
}
