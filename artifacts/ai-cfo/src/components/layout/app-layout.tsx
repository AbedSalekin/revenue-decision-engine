import { ReactNode } from "react";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { useAuth } from "@/hooks/use-auth";
import { useSidebar, SidebarProvider } from "@/hooks/use-sidebar";
import { Redirect } from "wouter";
import { Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function AppLayoutInner({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const { collapsed } = useSidebar();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main
        className="flex flex-col min-h-screen transition-all duration-200"
        style={{ paddingLeft: collapsed ? 60 : 220 }}
      >
        <Topbar />
        <div className="flex-1 p-6 md:p-8">
          <AnimatePresence mode="wait">
            {children}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <AppLayoutInner>{children}</AppLayoutInner>
    </SidebarProvider>
  );
}
