import { useState } from "react";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLogin } from "@workspace/api-client-react";
import { ArrowRight, Loader2, TrendingUp, Activity, Zap, LineChart } from "lucide-react";
import { motion } from "framer-motion";
import {
  AreaChart, Area, ResponsiveContainer, Tooltip, XAxis
} from "recharts";

// ── Mini chart data (static preview) ───────────────────────────────────────

const PREVIEW_CHART = [
  { m: "Aug", v: 11200 },
  { m: "Sep", v: 12100 },
  { m: "Oct", v: 13400 },
  { m: "Nov", v: 14200 },
  { m: "Dec", v: 15800 },
  { m: "Jan", v: 17600 },
  { m: "Feb", v: 19100 },
  { m: "Mar", v: 21400 },
  { m: "Apr", v: 24850 },
];

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

// ── Mini metric pill ────────────────────────────────────────────────────────

function MetricPill({
  label,
  value,
  up,
  icon: Icon,
  delay,
}: {
  label: string;
  value: string;
  up?: boolean;
  icon: any;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="flex items-center gap-3 bg-white/5 border border-white/8 rounded-xl px-4 py-3 backdrop-blur-sm"
    >
      <div className="w-7 h-7 rounded-lg bg-violet-500/20 flex items-center justify-center shrink-0">
        <Icon className="w-3.5 h-3.5 text-violet-300" />
      </div>
      <div>
        <div className="text-[10px] text-white/40 font-medium uppercase tracking-wide">{label}</div>
        <div className={`text-[15px] font-semibold leading-tight ${up ? "text-emerald-400" : "text-white"}`}>
          {value}
        </div>
      </div>
    </motion.div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────

export default function Login() {
  const [error, setError] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const loginMutation = useLogin({
    mutation: {
      onSuccess: (data) => {
        localStorage.setItem("ai_cfo_token", data.token);
        window.location.href = "/dashboard";
      },
      onError: (err) => {
        setError(err.error || "Invalid email or password");
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
    <div className="min-h-screen w-full flex bg-[#080810]">

      {/* ── Left: Form ───────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, x: -16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full lg:w-[46%] flex items-center justify-center p-8 sm:p-12 lg:p-16 relative z-10"
      >
        {/* Subtle left glow */}
        <div className="absolute top-1/2 left-0 -translate-y-1/2 w-80 h-80 bg-violet-600/8 rounded-full blur-[120px] pointer-events-none" />

        <div className="w-full max-w-[380px] relative">

          {/* Logo */}
          <div className="flex items-center gap-2.5 mb-12">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-violet-900/40">
              <LineChart className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="font-semibold text-[16px] text-white tracking-tight">AI CFO</span>
          </div>

          {/* Headline */}
          <div className="mb-9">
            <h1 className="text-[32px] font-bold text-white leading-[1.15] tracking-tight mb-3">
              Turn Stripe data<br />
              into decisions.
            </h1>
            <p className="text-[14px] text-white/45 leading-relaxed">
              Connect Stripe, get live revenue analytics, AI forecasts, and weekly action plans — in minutes.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[13px] font-medium"
              >
                {error}
              </motion.div>
            )}

            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-white/60 uppercase tracking-wide">
                Email
              </label>
              <div className={`relative rounded-xl transition-all duration-200 ${
                focusedField === "email"
                  ? "shadow-[0_0_0_2px_rgba(139,92,246,0.4)]"
                  : ""
              }`}>
                <input
                  {...form.register("email")}
                  type="email"
                  placeholder="founder@startup.com"
                  autoComplete="email"
                  onFocus={() => setFocusedField("email")}
                  onBlur={() => setFocusedField(null)}
                  className="w-full h-[46px] px-4 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500/60 text-[14px] text-white placeholder:text-white/20 outline-none transition-all duration-200"
                />
              </div>
              {form.formState.errors.email && (
                <p className="text-rose-400 text-[12px]">{form.formState.errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-white/60 uppercase tracking-wide">
                Password
              </label>
              <div className={`relative rounded-xl transition-all duration-200 ${
                focusedField === "password"
                  ? "shadow-[0_0_0_2px_rgba(139,92,246,0.4)]"
                  : ""
              }`}>
                <input
                  {...form.register("password")}
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField(null)}
                  className="w-full h-[46px] px-4 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500/60 text-[14px] text-white placeholder:text-white/20 outline-none transition-all duration-200"
                />
              </div>
              {form.formState.errors.password && (
                <p className="text-rose-400 text-[12px]">{form.formState.errors.password.message}</p>
              )}
            </div>

            {/* CTA */}
            <div className="pt-2 space-y-3">
              <button
                type="submit"
                disabled={loginMutation.isPending}
                className="w-full h-[48px] rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-[14px] flex items-center justify-center gap-2 transition-all duration-200 hover:shadow-[0_0_24px_rgba(139,92,246,0.4)] hover:scale-[1.01] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100"
              >
                {loginMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>Sign in to Dashboard <ArrowRight className="w-4 h-4 opacity-70" /></>
                )}
              </button>

              <p className="text-center text-[12px] text-white/25">
                Connect Stripe in 30 seconds. No setup required.
              </p>
            </div>
          </form>

          {/* Sign up link */}
          <p className="text-center text-[13px] text-white/35 mt-8">
            No account?{" "}
            <Link href="/register" className="text-violet-400 font-medium hover:text-violet-300 transition-colors">
              Create one free
            </Link>
          </p>
        </div>
      </motion.div>

      {/* ── Right: Product preview ──────────────────────────────── */}
      <div className="hidden lg:flex w-[54%] relative overflow-hidden items-center justify-center p-12">

        {/* Background glow orbs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[20%] left-[20%] w-[500px] h-[500px] bg-violet-600/12 rounded-full blur-[120px]" />
          <div className="absolute bottom-[15%] right-[10%] w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[100px]" />
          <div className="absolute top-[10%] right-[25%] w-[200px] h-[200px] bg-violet-400/8 rounded-full blur-[60px]" />
        </div>

        {/* Vertical separator */}
        <div className="absolute left-0 inset-y-0 w-px bg-gradient-to-b from-transparent via-white/8 to-transparent" />

        {/* Dashboard card */}
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          className="relative z-10 w-full max-w-[440px]"
        >
          {/* Outer glow */}
          <div className="absolute inset-0 rounded-2xl bg-violet-600/10 blur-xl -z-10 scale-105" />

          <div className="bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl">

            {/* Card header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/6">
              <div className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-md bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                  <LineChart className="w-3 h-3 text-white" />
                </div>
                <span className="text-[13px] font-semibold text-white/80">Revenue Overview</span>
              </div>
              <span className="text-[11px] text-white/30 font-medium">Last 9 months</span>
            </div>

            {/* MRR value */}
            <div className="px-5 pt-5 pb-2">
              <div className="text-[11px] text-white/35 font-medium uppercase tracking-wide mb-1">
                Monthly Recurring Revenue
              </div>
              <div className="flex items-end gap-2.5">
                <span className="text-[32px] font-bold text-white leading-none">$24,850</span>
                <span className="text-[13px] text-emerald-400 font-semibold mb-1 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  +11.4% MoM
                </span>
              </div>
            </div>

            {/* Chart */}
            <div className="h-[140px] w-full px-1 pb-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={PREVIEW_CHART} margin={{ top: 10, right: 8, left: 8, bottom: 0 }}>
                  <defs>
                    <linearGradient id="previewGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="m"
                    stroke="rgba(255,255,255,0.15)"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    dy={4}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1a1a2e",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "10px",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                    formatter={(v: number) => [`$${v.toLocaleString()}`, "MRR"]}
                    labelStyle={{ color: "rgba(255,255,255,0.5)", fontSize: "11px" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="v"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    fill="url(#previewGrad)"
                    dot={false}
                    activeDot={{ r: 3, fill: "#8b5cf6", stroke: "#080810", strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Metrics row */}
            <div className="grid grid-cols-3 gap-3 px-5 pb-5 pt-1">
              <MetricPill label="Churn Rate" value="2.4%" icon={Activity} delay={0.5} />
              <MetricPill label="Active Users" value="187" icon={TrendingUp} delay={0.55} />
              <MetricPill label="AI Forecast" value="$28.1k" up icon={Zap} delay={0.6} />
            </div>
          </div>

          {/* Caption below card */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-center text-[12px] text-white/25 mt-4"
          >
            Real data from your Stripe account. Updates every hour.
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}
