import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetDemoMode,
  useSetDemoMode,
  useSetDemoCompany,
  useGetStripeStatus,
  useConnectStripe,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Link as LinkIcon, CheckCircle2, Building2, ShoppingBag, Smartphone } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

const stripeSchema = z.object({
  apiKey: z.string().min(1, "Stripe API Key is required"),
});

const COMPANY_TYPES = [
  { key: "saas", label: "B2B SaaS", icon: Building2 },
  { key: "marketplace", label: "Marketplace", icon: ShoppingBag },
  { key: "subscription", label: "Consumer", icon: Smartphone },
] as const;

type CompanyType = (typeof COMPANY_TYPES)[number]["key"];

export function Topbar() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: demoStatus } = useGetDemoMode();
  const { data: stripeStatus } = useGetStripeStatus();

  const invalidateDashboard = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
    queryClient.invalidateQueries({ queryKey: ["/api/dashboard/revenue-chart"] });
    queryClient.invalidateQueries({ queryKey: ["/api/dashboard/revenue-breakdown"] });
  };

  const setDemoMode = useSetDemoMode({
    mutation: {
      onSuccess: () => {
        invalidateDashboard();
        queryClient.invalidateQueries({ queryKey: ["/api/stripe/demo-mode"] });
        toast({ title: "View mode updated" });
      },
    },
  });

  const setDemoCompany = useSetDemoCompany({
    mutation: {
      onSuccess: () => {
        invalidateDashboard();
        toast({ title: "Demo company switched" });
      },
    },
  });

  const connectStripe = useConnectStripe({
    mutation: {
      onSuccess: () => {
        setIsModalOpen(false);
        queryClient.invalidateQueries({ queryKey: ["/api/stripe/status"] });
        invalidateDashboard();
        toast({ title: "Stripe connected successfully!" });
      },
      onError: (err) => {
        toast({ title: "Error", description: err.error, variant: "destructive" });
      },
    },
  });

  const form = useForm<z.infer<typeof stripeSchema>>({
    resolver: zodResolver(stripeSchema),
    defaultValues: { apiKey: "" },
  });

  const onSubmit = (values: z.infer<typeof stripeSchema>) => {
    connectStripe.mutate({ data: values });
  };

  const isDemo = demoStatus?.demoMode;
  const isConnected = stripeStatus?.connected;
  const currentCompanyType = (demoStatus?.companyType as CompanyType) || "saas";

  return (
    <header className="h-14 px-5 flex items-center justify-between border-b border-border bg-background/90 backdrop-blur-md sticky top-0 z-40">
      <div className="flex items-center gap-3">
        <h2 className="text-[15px] font-semibold text-foreground">Overview</h2>
        {isDemo && (
          <div className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-semibold uppercase tracking-wide">
            Demo
          </div>
        )}
        {isConnected && !isDemo && (
          <div className="flex items-center gap-1.5 text-[12px] text-emerald-400 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Live Data</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* Company type switcher (only in demo mode) */}
        {isDemo && (
          <div className="flex items-center gap-1 bg-secondary/60 rounded-lg p-1">
            {COMPANY_TYPES.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                disabled={setDemoCompany.isPending}
                onClick={() => setDemoCompany.mutate({ data: { companyType: key } })}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-all",
                  currentCompanyType === key
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="w-3 h-3" />
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Demo mode toggle */}
        <div className="flex items-center gap-2">
          <label htmlFor="demo-mode-toggle" className="text-[12px] font-medium text-muted-foreground cursor-pointer select-none">
            Demo
          </label>
          <Switch
            id="demo-mode-toggle"
            checked={!!isDemo}
            onCheckedChange={(checked) => setDemoMode.mutate({ data: { demoMode: checked } })}
            disabled={setDemoMode.isPending}
            className="data-[state=checked]:bg-amber-500"
          />
        </div>

        {/* Connect Stripe (only if not in demo and not connected) */}
        {!isDemo && !isConnected && (
          <Dialog.Root open={isModalOpen} onOpenChange={setIsModalOpen}>
            <Dialog.Trigger asChild>
              <Button variant="default" size="sm" className="h-8 text-[12px] gap-1.5 rounded-lg px-3 bg-primary hover:bg-primary/90 transition-all">
                <LinkIcon className="w-3.5 h-3.5" />
                Connect Stripe
              </Button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 animate-in fade-in" />
              <Dialog.Content className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] z-50 w-full max-w-md bg-card border border-border rounded-xl p-6 shadow-2xl animate-in zoom-in-95">
                <Dialog.Title className="text-[18px] font-semibold text-foreground mb-1">
                  Connect Stripe
                </Dialog.Title>
                <Dialog.Description className="text-[13px] text-muted-foreground mb-5">
                  Enter your Stripe secret key to sync your live financial data. We recommend using a restricted key.
                </Dialog.Description>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div>
                    <input
                      {...form.register("apiKey")}
                      type="password"
                      placeholder="sk_live_..."
                      className="w-full px-3 py-2 text-[13px] bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                    />
                    {form.formState.errors.apiKey && (
                      <p className="text-destructive text-[12px] mt-1">{form.formState.errors.apiKey.message}</p>
                    )}
                  </div>
                  <div className="flex justify-end gap-2 mt-6">
                    <Dialog.Close asChild>
                      <Button variant="ghost" type="button" className="h-9 text-[13px]">Cancel</Button>
                    </Dialog.Close>
                    <Button type="submit" disabled={connectStripe.isPending} className="h-9 text-[13px] bg-primary">
                      {connectStripe.isPending ? "Connecting…" : "Connect Account"}
                    </Button>
                  </div>
                </form>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        )}
      </div>
    </header>
  );
}
