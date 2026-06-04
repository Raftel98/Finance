"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  TrendingUp,
  Telescope,
  ArrowLeftRight,
  Calculator,
  Building2,
  CreditCard,
  Target,
  FileText,
  BarChart3,
  Settings,
  Landmark,
} from "lucide-react";

const NAV = [
  {
    label: "Overview",
    items: [
      { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
      { href: "/dashboard/net-worth", icon: TrendingUp, label: "Net worth" },
      { href: "/dashboard/forecast", icon: Telescope, label: "Forecast" },
    ],
  },
  {
    label: "Cash flow",
    items: [
      { href: "/dashboard/transactions", icon: ArrowLeftRight, label: "Transactions" },
      { href: "/dashboard/budgets", icon: Calculator, label: "Budgets" },
    ],
  },
  {
    label: "Balance sheet",
    items: [
      { href: "/dashboard/assets", icon: Building2, label: "Assets" },
      { href: "/dashboard/liabilities", icon: Landmark, label: "Liabilities" },
      { href: "/dashboard/credit-cards", icon: CreditCard, label: "Credit cards" },
    ],
  },
  {
    label: "Planning",
    items: [
      { href: "/dashboard/goals", icon: Target, label: "Goals" },
      { href: "/dashboard/ai-import", icon: FileText, label: "AI import" },
      { href: "/dashboard/reports", icon: BarChart3, label: "Reports" },
      { href: "/dashboard/settings", icon: Settings, label: "Settings" },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-50 flex w-56 flex-col border-r bg-card">
      {/* Logo */}
      <div className="flex items-center gap-2.5 border-b px-4 py-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-foreground text-background text-xs font-semibold">
          PW
        </div>
        <div>
          <div className="text-sm font-medium leading-none">PWOS</div>
          <div className="mt-0.5 text-[10px] text-muted-foreground leading-none">
            Personal Wealth OS
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3">
        {NAV.map((group) => (
          <div key={group.label} className="mb-4 px-3">
            <p className="mb-1 px-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              {group.label}
            </p>
            {group.items.map(({ href, icon: Icon, label }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors",
                  isActive(href)
                    ? "bg-accent text-foreground font-medium"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  );
}
