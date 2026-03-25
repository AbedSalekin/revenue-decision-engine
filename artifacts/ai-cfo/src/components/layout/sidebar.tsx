import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, Lightbulb, LogOut, LineChart, 
  PanelLeftClose, PanelLeft
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useSidebar } from "@/hooks/use-sidebar";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/insights", label: "AI Insights", icon: Lightbulb },
];

export function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { collapsed, toggle } = useSidebar();

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex flex-col bg-card border-r border-border transition-all duration-200",
        collapsed ? "w-[60px]" : "w-[220px]"
      )}
    >
      {/* Logo */}
      <div className="h-14 px-4 flex items-center justify-between border-b border-border/50 shrink-0">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-6 h-6 rounded bg-primary flex items-center justify-center shadow-sm shrink-0">
            <LineChart className="w-3.5 h-3.5 text-white" />
          </div>
          {!collapsed && (
            <span className="font-semibold text-[15px] tracking-tight text-foreground whitespace-nowrap">
              AI CFO
            </span>
          )}
        </div>
        <button
          onClick={toggle}
          className="text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded"
        >
          {collapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav */}
      <div className="flex-1 px-2 py-4 space-y-0.5">
        {navItems.map((item) => {
          const isActive = location === item.href || (item.href === "/dashboard" && location === "/");
          return (
            <Link key={item.href} href={item.href} className="block">
              <div
                title={collapsed ? item.label : undefined}
                className={cn(
                  "flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all duration-150 group cursor-pointer text-[13px] font-medium",
                  collapsed && "justify-center",
                  isActive
                    ? "bg-primary/12 text-primary"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <item.icon
                  className={cn(
                    "w-4 h-4 shrink-0 transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                  )}
                />
                {!collapsed && item.label}
              </div>
            </Link>
          );
        })}
      </div>

      {/* User */}
      <div className="p-3 border-t border-border/50 shrink-0">
        {!collapsed && (
          <div className="px-2 mb-2 overflow-hidden">
            <div className="text-[13px] font-medium truncate text-foreground">{user?.name}</div>
            <div className="text-[11px] text-muted-foreground truncate">{user?.email}</div>
          </div>
        )}
        <button
          title={collapsed ? "Sign Out" : undefined}
          className={cn(
            "flex items-center gap-2 px-2.5 py-1.5 text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors w-full rounded-lg hover:bg-secondary/50",
            collapsed && "justify-center"
          )}
          onClick={logout}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && "Sign Out"}
        </button>
      </div>
    </aside>
  );
}
