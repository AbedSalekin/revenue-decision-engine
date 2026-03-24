import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetDemoMode,
  useSetDemoMode,
  useGetStripeStatus,
  useConnectStripe,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Link as LinkIcon, CheckCircle2 } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "@/hooks/use-toast";

const stripeSchema = z.object({
  apiKey: z.string().min(1, "Stripe API Key is required"),
});

export function Topbar() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: demoStatus } = useGetDemoMode();
  const { data: stripeStatus } = useGetStripeStatus();

  const setDemoMode = useSetDemoMode({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
        queryClient.invalidateQueries({ queryKey: ["/api/dashboard/revenue-chart"] });
        queryClient.invalidateQueries({ queryKey: ["/api/stripe/demo-mode"] });
        toast({ title: "View mode updated" });
      },
    },
  });

  const connectStripe = useConnectStripe({
    mutation: {
      onSuccess: () => {
        setIsModalOpen(false);
        queryClient.invalidateQueries({ queryKey: ["/api/stripe/status"] });
        queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
        queryClient.invalidateQueries({ queryKey: ["/api/dashboard/revenue-chart"] });
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

  return (
    <header className="h-20 px-8 flex items-center justify-between border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-40">
      <div>
        <h2 className="text-xl font-display font-semibold text-foreground">Overview</h2>
      </div>

      <div className="flex items-center gap-4">
        {isConnected && !isDemo && (
          <div className="flex items-center gap-2 text-sm text-emerald-400 bg-emerald-400/10 px-3 py-1.5 rounded-full border border-emerald-400/20">
            <CheckCircle2 className="w-4 h-4" />
            <span className="font-medium">Stripe Connected</span>
          </div>
        )}

        <button
          onClick={() => setDemoMode.mutate({ data: { demoMode: !isDemo } })}
          disabled={setDemoMode.isPending}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/80 border border-border transition-all"
        >
          <RefreshCw className={`w-4 h-4 text-muted-foreground ${setDemoMode.isPending ? "animate-spin" : ""}`} />
          <span className="text-sm font-medium text-foreground">
            {isDemo ? "Viewing Demo Data" : "Viewing Live Data"}
          </span>
        </button>

        {!isDemo && !isConnected && (
          <Dialog.Root open={isModalOpen} onOpenChange={setIsModalOpen}>
            <Dialog.Trigger asChild>
              <Button variant="default" size="sm" className="gap-2">
                <LinkIcon className="w-4 h-4" />
                Connect Stripe
              </Button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-in fade-in" />
              <Dialog.Content className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] z-50 w-full max-w-md bg-card border border-white/10 rounded-2xl p-6 shadow-2xl animate-in zoom-in-95">
                <Dialog.Title className="text-xl font-display font-bold text-foreground mb-2">
                  Connect Stripe
                </Dialog.Title>
                <Dialog.Description className="text-sm text-muted-foreground mb-6">
                  Enter your Stripe secret key to sync your live financial data. We recommend using a restricted key.
                </Dialog.Description>

                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div>
                    <input
                      {...form.register("apiKey")}
                      type="password"
                      placeholder="sk_live_..."
                      className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                    />
                    {form.formState.errors.apiKey && (
                      <p className="text-destructive text-sm mt-1">{form.formState.errors.apiKey.message}</p>
                    )}
                  </div>

                  <div className="flex justify-end gap-3 mt-6">
                    <Dialog.Close asChild>
                      <Button variant="ghost" type="button">Cancel</Button>
                    </Dialog.Close>
                    <Button type="submit" disabled={connectStripe.isPending}>
                      {connectStripe.isPending ? "Connecting..." : "Connect Account"}
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
