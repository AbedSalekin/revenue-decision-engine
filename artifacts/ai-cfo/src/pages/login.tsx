import { useState } from "react";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLogin } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { LineChart, ArrowRight } from "lucide-react";

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
    <div className="min-h-screen w-full flex bg-background">
      {/* Left side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-24 relative z-10">
        <div className="w-full max-w-md space-y-8 animate-in slide-in-from-bottom-8 duration-700">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-cyan-500 flex items-center justify-center shadow-lg shadow-primary/25">
              <LineChart className="w-6 h-6 text-white" />
            </div>
            <span className="font-display font-bold text-3xl text-foreground tracking-tight">AI CFO</span>
          </div>

          <div>
            <h1 className="text-4xl font-display font-bold text-foreground mb-2">Welcome back</h1>
            <p className="text-muted-foreground text-lg">Log in to your financial dashboard.</p>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {error && (
              <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground ml-1">Email Address</label>
              <input
                {...form.register("email")}
                type="email"
                placeholder="founder@startup.com"
                className="w-full px-5 py-4 rounded-xl bg-card border border-border focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-foreground placeholder:text-muted-foreground outline-none"
              />
              {form.formState.errors.email && (
                <p className="text-destructive text-sm ml-1">{form.formState.errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground ml-1">Password</label>
              <input
                {...form.register("password")}
                type="password"
                placeholder="••••••••"
                className="w-full px-5 py-4 rounded-xl bg-card border border-border focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-foreground placeholder:text-muted-foreground outline-none"
              />
              {form.formState.errors.password && (
                <p className="text-destructive text-sm ml-1">{form.formState.errors.password.message}</p>
              )}
            </div>

            <Button 
              type="submit" 
              size="lg" 
              className="w-full group text-base mt-4" 
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? "Logging in..." : "Sign in to Dashboard"}
              {!loginMutation.isPending && <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />}
            </Button>
          </form>

          <p className="text-center text-muted-foreground">
            Don't have an account?{" "}
            <Link href="/register" className="text-primary font-semibold hover:underline decoration-2 underline-offset-4 transition-all">
              Create an account
            </Link>
          </p>
        </div>
      </div>

      {/* Right side - Visuals */}
      <div className="hidden lg:flex w-1/2 relative bg-secondary overflow-hidden items-center justify-center p-12">
        {/* Background image loaded dynamically via generated assets */}
        <div className="absolute inset-0 z-0 opacity-40 mix-blend-screen">
          <img 
            src={`${import.meta.env.BASE_URL}images/auth-bg.png`} 
            alt="Abstract finance visualization" 
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent z-10" />
        
        <div className="relative z-20 max-w-lg glass-panel rounded-3xl p-10 transform hover:-translate-y-2 transition-transform duration-500">
          <h2 className="text-3xl font-display font-bold text-white mb-4">Financial Intelligence on Autopilot.</h2>
          <p className="text-blue-100/80 text-lg leading-relaxed mb-8">
            Connect your Stripe account instantly. We pull revenue, churn, and subscriptions to generate actionable insights and precise cashflow forecasts.
          </p>
          <div className="flex gap-4">
            <div className="flex-1 bg-white/5 rounded-2xl p-5 border border-white/10">
              <div className="text-sm text-blue-200/60 mb-1">MRR Growth</div>
              <div className="text-2xl font-bold text-white">+24.5%</div>
            </div>
            <div className="flex-1 bg-white/5 rounded-2xl p-5 border border-white/10">
              <div className="text-sm text-blue-200/60 mb-1">Runway</div>
              <div className="text-2xl font-bold text-white">14 mo</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
