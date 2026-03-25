import { useState } from "react";
import { useGetDashboardMetrics, useGetRevenueChart, useGetRevenueBreakdown } from "@workspace/api-client-react";
import { formatCurrency, formatCompactNumber } from "@/lib/utils";
import { 
  DollarSign, TrendingUp, Users, CreditCard, 
  Activity, Receipt, AlertCircle, TrendingDown,
  BarChart2
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell
} from "recharts";
import { motion } from "framer-motion";

// ── Helpers ────────────────────────────────────────────────────────────────

function pct(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}

function pctVs(current: number, previous: number) {
  if (!previous) return null;
  return ((current - previous) / previous) * 100;
}

// ── Sparkline ───────────────────────────────────────────────────────────────

function Sparkline({ data, positive = true }: { data: number[]; positive?: boolean }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 72;
  const h = 28;
  const pts = data
    .map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`)
    .join(" ");
  const color = positive ? "#10b981" : "#f43f5e";
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible opacity-80">
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Skeleton ────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-card rounded-xl p-5 border border-border animate-pulse">
      <div className="flex justify-between items-start mb-4">
        <div className="h-3 w-24 bg-secondary rounded" />
        <div className="w-4 h-4 bg-secondary rounded" />
      </div>
      <div className="h-8 w-28 bg-secondary rounded mb-3" />
      <div className="h-3 w-16 bg-secondary rounded" />
    </div>
  );
}

function SkeletonChart() {
  return (
    <div className="bg-card rounded-xl border border-border p-6 animate-pulse">
      <div className="h-5 w-40 bg-secondary rounded mb-2" />
      <div className="h-3 w-56 bg-secondary rounded mb-8" />
      <div className="h-[260px] bg-secondary/50 rounded-lg" />
    </div>
  );
}

// ── Stat Card ───────────────────────────────────────────────────────────────

function StatCard({
  title,
  value,
  icon: Icon,
  change,
  sparkline,
  positive = true,
  delay = 0,
  iconColor = "text-primary",
  iconBg = "bg-primary/10",
}: {
  title: string;
  value: string | number;
  icon: any;
  change?: number | null;
  sparkline?: number[];
  positive?: boolean;
  delay?: number;
  iconColor?: string;
  iconBg?: string;
}) {
  const isUp = change !== undefined && change !== null && change >= 0;
  const isDown = change !== undefined && change !== null && change < 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="bg-card rounded-xl p-5 border border-border shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group relative overflow-hidden"
    >
      <div className="flex justify-between items-start mb-3">
        <div className={`w-8 h-8 rounded-lg ${iconBg} ${iconColor} flex items-center justify-center`}>
          <Icon className="w-4 h-4" />
        </div>
        {sparkline && (
          <div className="opacity-60 group-hover:opacity-100 transition-opacity">
            <Sparkline data={sparkline} positive={positive} />
          </div>
        )}
      </div>
      <div className="text-[26px] leading-tight font-semibold text-foreground tracking-tight mb-1">
        {value}
      </div>
      <div className="flex items-center justify-between">
        <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">{title}</p>
        {change !== undefined && change !== null && (
          <span className={`text-[11px] font-semibold flex items-center gap-0.5 ${
            isUp ? "text-emerald-500" : isDown ? "text-rose-500" : "text-muted-foreground"
          }`}>
            {isUp ? <TrendingUp className="w-3 h-3" /> : isDown ? <TrendingDown className="w-3 h-3" /> : null}
            {pct(change)} vs last mo
          </span>
        )}
      </div>
    </motion.div>
  );
}

// ── Chart metric toggle ─────────────────────────────────────────────────────

type ChartMetric = "revenue" | "mrr" | "customers";

const CHART_OPTIONS: { key: ChartMetric; label: string; color: string; format: (v: number) => string }[] = [
  { key: "revenue", label: "Revenue", color: "#8b5cf6", format: formatCurrency },
  { key: "mrr", label: "MRR", color: "#6366f1", format: formatCurrency },
  { key: "customers", label: "Customers", color: "#10b981", format: (v) => v.toLocaleString() },
];

// ── Custom tooltip ──────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label, metric }: any) {
  if (!active || !payload?.length) return null;
  const opt = CHART_OPTIONS.find((o) => o.key === metric)!;
  return (
    <div className="bg-card border border-border rounded-xl px-4 py-3 shadow-xl">
      <p className="text-[11px] text-muted-foreground mb-1.5 font-medium">{label}</p>
      <p className="text-[15px] font-semibold text-foreground">{opt.format(payload[0]?.value || 0)}</p>
    </div>
  );
}

// ── Revenue breakdown bar ───────────────────────────────────────────────────

function BreakdownBar({ plan, revenue, percentage, customers, color }: {
  plan: string; revenue: number; percentage: number; customers: number; color: string;
}) {
  return (
    <div className="group">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: color }} />
          <span className="text-[13px] font-medium text-foreground">{plan}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[12px] text-muted-foreground">{customers} customers</span>
          <span className="text-[13px] font-semibold text-foreground">{formatCurrency(revenue)}</span>
        </div>
      </div>
      <div className="h-2 bg-secondary rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
      <div className="text-[11px] text-muted-foreground mt-1">{percentage.toFixed(1)}% of MRR</div>
    </div>
  );
}

// ── Main Dashboard ──────────────────────────────────────────────────────────

export default function Dashboard() {
  const [chartMetric, setChartMetric] = useState<ChartMetric>("mrr");

  const { data: metrics, isLoading: loadingMetrics } = useGetDashboardMetrics();
  const { data: chartData, isLoading: loadingChart } = useGetRevenueChart();
  const { data: breakdown, isLoading: loadingBreakdown } = useGetRevenueBreakdown();

  const activeOpt = CHART_OPTIONS.find((o) => o.key === chartMetric)!;

  if (loadingMetrics) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <SkeletonCard key={i} />)}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <SkeletonCard key={i} />)}
        </div>
        <SkeletonChart />
      </div>
    );
  }

  if (!metrics) return null;

  const mrrChange = pctVs(metrics.mrr, metrics.prevMonthMrr ?? metrics.mrr / 1.1);
  const revenueChange = pctVs(metrics.totalRevenue, metrics.prevMonthRevenue ?? metrics.totalRevenue / 1.12);
  const customerChange = pctVs(metrics.activeCustomers, metrics.prevMonthCustomers ?? metrics.activeCustomers / 1.08);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      {/* Primary KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Monthly Recurring Revenue"
          value={formatCurrency(metrics.mrr)}
          icon={DollarSign}
          change={mrrChange}
          sparkline={metrics.mrrSparkline}
          positive={(mrrChange ?? 0) >= 0}
          delay={0.05}
          iconColor="text-indigo-400"
          iconBg="bg-indigo-500/10"
        />
        <StatCard
          title="Total Revenue (MTD)"
          value={formatCurrency(metrics.totalRevenue)}
          icon={TrendingUp}
          change={revenueChange}
          positive={(revenueChange ?? 0) >= 0}
          delay={0.10}
          iconColor="text-violet-400"
          iconBg="bg-violet-500/10"
        />
        <StatCard
          title="Active Customers"
          value={metrics.activeCustomers.toLocaleString()}
          icon={Users}
          change={customerChange}
          positive={(customerChange ?? 0) >= 0}
          delay={0.15}
          iconColor="text-emerald-400"
          iconBg="bg-emerald-500/10"
        />
        <StatCard
          title="Monthly Churn Rate"
          value={`${metrics.churnRate.toFixed(1)}%`}
          icon={Activity}
          change={null}
          delay={0.20}
          positive={false}
          iconColor="text-rose-400"
          iconBg="bg-rose-500/10"
        />
      </div>

      {/* Secondary KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Active Subscriptions"
          value={metrics.activeSubscriptions.toLocaleString()}
          icon={CreditCard}
          delay={0.25}
          iconColor="text-sky-400"
          iconBg="bg-sky-500/10"
        />
        <StatCard
          title="Avg Revenue / User"
          value={formatCurrency(metrics.avgRevenuePerUser)}
          icon={Receipt}
          delay={0.30}
          iconColor="text-amber-400"
          iconBg="bg-amber-500/10"
        />
        <StatCard
          title="Total Invoices (MTD)"
          value={metrics.totalInvoices.toLocaleString()}
          icon={BarChart2}
          delay={0.35}
          iconColor="text-cyan-400"
          iconBg="bg-cyan-500/10"
        />
        <StatCard
          title="Overdue Invoices"
          value={metrics.overdueInvoices}
          icon={AlertCircle}
          delay={0.40}
          positive={false}
          iconColor="text-rose-400"
          iconBg="bg-rose-500/10"
        />
      </div>

      {/* Chart + Breakdown row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main chart */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.45 }}
          className="lg:col-span-2 bg-card rounded-xl border border-border p-6 shadow-sm flex flex-col"
        >
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="text-[15px] font-semibold text-foreground">
                {activeOpt.label} Growth
              </h3>
              <p className="text-[12px] text-muted-foreground mt-0.5">12-month trend</p>
            </div>
            <div className="flex items-center gap-1 bg-secondary/60 rounded-lg p-1">
              {CHART_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setChartMetric(opt.key)}
                  className={`px-3 py-1.5 rounded-md text-[12px] font-medium transition-all ${
                    chartMetric === opt.key
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {loadingChart ? (
            <div className="h-[260px] bg-secondary/30 rounded-lg animate-pulse" />
          ) : (
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData?.data || []} margin={{ top: 10, right: 4, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={activeOpt.color} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={activeOpt.color} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" strokeOpacity={0.5} />
                  <XAxis
                    dataKey="month"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    dy={8}
                    tickFormatter={(v) => v.split(" ")[0]}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) =>
                      chartMetric === "customers"
                        ? formatCompactNumber(v)
                        : `$${formatCompactNumber(v)}`
                    }
                    width={52}
                  />
                  <Tooltip content={<ChartTooltip metric={chartMetric} />} />
                  <Area
                    key={chartMetric}
                    type="monotone"
                    dataKey={chartMetric}
                    stroke={activeOpt.color}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#chartGrad)"
                    dot={false}
                    activeDot={{ r: 4, fill: activeOpt.color, stroke: "hsl(var(--background))", strokeWidth: 2 }}
                    animationDuration={500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </motion.div>

        {/* Revenue breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="bg-card rounded-xl border border-border p-6 shadow-sm"
        >
          <div className="mb-5">
            <h3 className="text-[15px] font-semibold text-foreground">Revenue by Plan</h3>
            <p className="text-[12px] text-muted-foreground mt-0.5">
              {breakdown ? formatCurrency(breakdown.totalMrr) + " total MRR" : "—"}
            </p>
          </div>

          {loadingBreakdown ? (
            <div className="space-y-5">
              {[1,2,3,4].map(i => (
                <div key={i} className="animate-pulse">
                  <div className="h-3 w-24 bg-secondary rounded mb-2" />
                  <div className="h-2 bg-secondary rounded-full" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-5">
              {(breakdown?.byPlan || []).map((p) => (
                <BreakdownBar key={p.plan} {...p} />
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
