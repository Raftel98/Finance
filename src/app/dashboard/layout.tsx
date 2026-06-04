import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/layout/Sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/auth/login");

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 pl-56">
        {children}
      </main>
    </div>
  );
}
