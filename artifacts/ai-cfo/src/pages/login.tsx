import { useState } from "react";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLogin } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { LineChart, ArrowRight, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const [error, setError] = useState<string | null>(null);
  const loginMutation = useLogin({
    mutation: {
      onSuccess: (data) => {
        localStorage.setItem("ai_cfo_token", data.token);
        window.location.href = "/dashboard";
      },
      onError: (err) => {
        setError(err.error || "Failed to login");
      },
    },
  });

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = (data: LoginForm) => {
    setError(null);
    loginMutation.mutate({ data });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="min-h-screen w-full flex bg-background"
    >
      {/* Left side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-24 relative z-10 bg-background">
        <div className="w-full max-w-[360px] space-y-8">
          <div className="flex items-center gap-2.5 mb-10">
            <div className="w-8 h-8 rounded bg-primary flex items-center justify-center shadow-sm">
              <LineChart className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-xl text-foreground tracking-tight">AI CFO</span>
          </div>

          <div>
            <h1 className="text-2xl font-semibold text-foreground mb-1.5">Welcome back</h1>
            <p className="text-[14px] text-muted-foreground">Log in to your financial dashboard.</p>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-[13px] font-medium">
                {error}
              </div>
            )}
            
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-foreground">Email Address</label>
              <input
                {...form.register("email")}
                type="email"
                placeholder="founder@startup.com"
                className="w-full h-[42px] px-3 rounded-lg bg-input border border-border focus:border-primary focus:ring-1 focus:ring-primary transition-all text-[14px] text-foreground placeholder:text-muted-foreground outline-none"
              />
              {form.formState.errors.email && (
                <p className="text-destructive text-[12px]">{form.formState.errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-foreground">Password</label>
              <input
                {...form.register("password")}
                type="password"
                placeholder="••••••••"
                className="w-full h-[42px] px-3 rounded-lg bg-input border border-border focus:border-primary focus:ring-1 focus:ring-primary transition-all text-[14px] text-foreground placeholder:text-muted-foreground outline-none"
              />
              {form.formState.errors.password && (
                <p className="text-destructive text-[12px]">{form.formState.errors.password.message}</p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full h-[44px] rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium text-[14px] mt-6 transition-all hover:scale-[1.01] active:scale-[0.98] border-0" 
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign in to Dashboard"}
              {!loginMutation.isPending && <ArrowRight className="w-4 h-4 ml-2 opacity-70" />}
            </Button>
          </form>

          <p className="text-center text-[13px] text-muted-foreground">
            Don't have an account?{" "}
            <Link href="/register" className="text-primary font-medium hover:text-primary/80 transition-colors">
              Create an account
            </Link>
          </p>
        </div>
      </div>

      {/* Right side - Visuals */}
      <div className="hidden lg:flex w-1/2 relative bg-[#0a0a0a] overflow-hidden items-center justify-center p-12 border-l border-white/5">
        <div className="absolute inset-0 z-0 opacity-20">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/30 rounded-full blur-[100px]" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-[100px]" />
        </div>
        
        <div className="relative z-20 w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
          <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center mb-6">
            <LineChart className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-2xl font-semibold text-white mb-3">Financial Intelligence</h2>
          <p className="text-[14px] text-white/60 leading-relaxed mb-8">
            Connect your Stripe account instantly. We pull revenue, churn, and subscriptions to generate actionable insights and precise cashflow forecasts.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-black/20 rounded-xl p-4 border border-white/5">
              <div className="text-[12px] text-white/50 mb-1 font-medium">MRR Growth</div>
              <div className="text-xl font-semibold text-emerald-400">+24.5%</div>
            </div>
            <div className="bg-black/20 rounded-xl p-4 border border-white/5">
              <div className="text-[12px] text-white/50 mb-1 font-medium">Runway</div>
              <div className="text-xl font-semibold text-white">14 mo</div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
