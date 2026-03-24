import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Lightbulb, LogOut, Settings, Wallet, LineChart } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/insights", label: "AI Insights", icon: Lightbulb },
];

export function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  return (
    <aside className="fixed inset-y-0 left-0 z-50 w-[220px] flex flex-col bg-card border-r border-border">
      <div className="h-14 px-5 flex items-center gap-2.5 border-b border-border/50">
        <div className="w-6 h-6 rounded bg-primary flex items-center justify-center shadow-sm">
          <LineChart className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="font-semibold text-[15px] tracking-tight text-foreground">
          AI CFO
        </span>
      </div>

      <div className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href} className="block">
              <div
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-200 group cursor-pointer text-[13px] font-medium",
                  isActive
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <item.icon
                  className={cn(
                    "w-4 h-4 transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                  )}
                />
                {item.label}
              </div>
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-border/50">
        <div className="flex flex-col gap-2">
          <div className="px-2 overflow-hidden mb-2">
            <div className="text-[13px] font-medium truncate text-foreground">{user?.name}</div>
            <div className="text-[12px] text-muted-foreground truncate">{user?.email}</div>
          </div>
          <button 
            className="flex items-center gap-2 px-2 py-1.5 text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors w-full justify-start rounded-lg hover:bg-secondary/50"
            onClick={logout}
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>
    </aside>
  );
}
