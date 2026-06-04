"use client";

import { signOut, useSession } from "next-auth/react";
import { Bell, LogOut, User } from "lucide-react";

interface TopbarProps {
  title: string;
}

export function Topbar({ title }: TopbarProps) {
  const { data: session } = useSession();
  const initials = session?.user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) ?? "U";

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b bg-card px-6">
      <h1 className="text-base font-medium">{title}</h1>
      <div className="flex items-center gap-2">
        <button
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2 rounded-md border px-2.5 py-1.5">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-[10px] font-semibold">
            {initials}
          </div>
          <span className="text-sm text-muted-foreground hidden sm:block">
            {session?.user?.name ?? session?.user?.email}
          </span>
          <button
            onClick={() => signOut({ callbackUrl: "/auth/login" })}
            className="text-muted-foreground hover:text-foreground transition-colors ml-1"
            aria-label="Sign out"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
}
