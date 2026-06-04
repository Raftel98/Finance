import { cn } from "@/lib/utils";
import { Topbar } from "@/components/layout/Topbar";

interface PageShellProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}

export function PageShell({ title, children, className, action }: PageShellProps) {
  return (
    <div className="flex flex-col min-h-screen">
      <Topbar title={title} />
      <div className={cn("flex-1 p-6", className)}>
        {action && (
          <div className="flex justify-between items-center mb-6">
            <div />
            {action}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
