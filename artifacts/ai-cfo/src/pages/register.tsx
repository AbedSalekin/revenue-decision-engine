import { useState } from "react";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRegister } from "@workspace/api-client-react";
import { ArrowRight, Loader2, TrendingUp, ShieldCheck, Zap, BarChart2, LineChart } from "lucide-react";
import { motion } from "framer-motion";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type RegisterForm = z.infer<typeof registerSchema>;

const FEATURES = [
  { icon: TrendingUp, label: "Live MRR & churn tracking", color: "text-violet-300" },
  { icon: Zap, label: "AI forecasts & weekly priorities", color: "text-indigo-300" },
  { icon: BarChart2, label: "Revenue breakdown by plan", color: "text-violet-300" },
  { icon: ShieldCheck, label: "Read-only Stripe access, always", color: "text-emerald-300" },
];

export default function Register() {
  const [error, setError] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const registerMutation = useRegister({
    mutation: {
      onSuccess: (data) => {
        localStorage.setItem("ai_cfo_token", data.token);
        window.location.href = "/dashboard";
      },
      onError: (err) => {
        setError(err.error || "Failed to create account");
      },
    },
  });

  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const onSubmit = (data: RegisterForm) => {
    setError(null);
    registerMutation.mutate({ data });
  };

  const inputClass = (field: string) =>
    `w-full h-[46px] px-4 rounded-xl bg-white/5 border text-[14px] text-white placeholder:text-white/20 outline-none transition-all duration-200 ${
      focusedField === field ? "border-violet-500/60" : "border-white/10"
    }`;

  const wrapClass = (field: string) =>
    `rounded-xl transition-all duration-200 ${
      focusedField === field ? "shadow-[0_0_0_2px_rgba(139,92,246,0.35)]" : ""
    }`;

  return (
    <div className="min-h-screen w-full flex bg-[#080810]">

      {/* ── Left: Form ───────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, x: -16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full lg:w-[46%] flex items-center justify-center p-8 sm:p-12 lg:p-16 relative z-10"
      >
        <div className="absolute top-1/2 left-0 -translate-y-1/2 w-80 h-80 bg-violet-600/8 rounded-full blur-[120px] pointer-events-none" />

        <div className="w-full max-w-[380px] relative">

          {/* Logo */}
          <div className="flex items-center gap-2.5 mb-10">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-violet-900/40">
              <LineChart className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-[16px] text-white tracking-tight">AI CFO</span>
          </div>

          {/* Headline */}
          <div className="mb-8">
            <h1 className="text-[28px] font-bold text-white leading-tight tracking-tight mb-2.5">
              Your financial co-pilot<br />starts here.
            </h1>
            <p className="text-[14px] text-white/40 leading-relaxed">
              Free to start. Connect Stripe and see your data in under 2 minutes.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3.5">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[13px] font-medium"
              >
                {error}
              </motion.div>
            )}

            {[
              { name: "name" as const, label: "Full Name", type: "text", placeholder: "Jane Doe", autoComplete: "name" },
              { name: "email" as const, label: "Email", type: "email", placeholder: "founder@startup.com", autoComplete: "email" },
              { name: "password" as const, label: "Password", type: "password", placeholder: "••••••••", autoComplete: "new-password" },
            ].map(({ name, label, type, placeholder, autoComplete }) => (
              <div key={name} className="space-y-1.5">
                <label className="text-[12px] font-medium text-white/55 uppercase tracking-wide">
                  {label}
                </label>
                <div className={wrapClass(name)}>
                  <input
                    {...form.register(name)}
                    type={type}
                    placeholder={placeholder}
                    autoComplete={autoComplete}
                    onFocus={() => setFocusedField(name)}
                    onBlur={() => setFocusedField(null)}
                    className={inputClass(name)}
                  />
                </div>
                {form.formState.errors[name] && (
                  <p className="text-rose-400 text-[12px]">
                    {form.formState.errors[name]?.message}
                  </p>
                )}
              </div>
            ))}

            <div className="pt-2 space-y-3">
              <button
                type="submit"
                disabled={registerMutation.isPending}
                className="w-full h-[48px] rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-[14px] flex items-center justify-center gap-2 transition-all duration-200 hover:shadow-[0_0_24px_rgba(139,92,246,0.4)] hover:scale-[1.01] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100"
              >
                {registerMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>Create free account <ArrowRight className="w-4 h-4 opacity-70" /></>
                )}
              </button>

              <p className="text-center text-[12px] text-white/22">
                Connect Stripe in 30 seconds. No setup required.
              </p>
            </div>
          </form>

          <p className="text-center text-[13px] text-white/32 mt-7">
            Already have an account?{" "}
            <Link href="/login" className="text-violet-400 font-medium hover:text-violet-300 transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>

      {/* ── Right: Value props ──────────────────────────────────── */}
      <div className="hidden lg:flex w-[54%] relative overflow-hidden items-center justify-center p-16">

        {/* Glow orbs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[25%] left-[15%] w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[130px]" />
          <div className="absolute bottom-[20%] right-[10%] w-[350px] h-[350px] bg-indigo-600/8 rounded-full blur-[100px]" />
        </div>

        <div className="absolute left-0 inset-y-0 w-px bg-gradient-to-b from-transparent via-white/8 to-transparent" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="relative z-10 w-full max-w-[400px] space-y-8"
        >
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 mb-5">
              <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
              <span className="text-[11px] text-violet-300 font-medium">Free to get started</span>
            </div>
            <h2 className="text-[28px] font-bold text-white leading-tight mb-3">
              Know your numbers.<br />Every single day.
            </h2>
            <p className="text-[14px] text-white/40 leading-relaxed">
              Stop pulling reports manually. AI CFO reads your Stripe data and tells you what matters — and what to do about it.
            </p>
          </div>

          {/* Feature list */}
          <div className="space-y-3">
            {FEATURES.map(({ icon: Icon, label, color }, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35 + i * 0.08, duration: 0.35 }}
                className="flex items-center gap-3 group"
              >
                <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center shrink-0 group-hover:border-violet-500/30 transition-all">
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <span className="text-[13px] text-white/60 font-medium">{label}</span>
              </motion.div>
            ))}
          </div>

          {/* Social proof */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.75 }}
            className="pt-2 border-t border-white/6"
          >
            <p className="text-[12px] text-white/25 leading-relaxed">
              "Finally a CFO tool that speaks founder. I use it every Monday morning."
            </p>
            <p className="text-[11px] text-white/20 mt-2 font-medium">— Indie founder, $40k MRR</p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
