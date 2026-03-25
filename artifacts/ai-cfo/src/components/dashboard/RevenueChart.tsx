import { useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import { motion } from "framer-motion";
import { formatCurrency, formatCompactNumber } from "@/lib/utils";
interface RevenueDataPoint {
  month: string;
  revenue: number;
  mrr: number;
  customers: number;
}

type ChartMetric = "revenue" | "mrr" | "customers";

const CHART_OPTIONS: {
  key: ChartMetric;
  label: string;
  color: string;
  format: (v: number) => string;
}[] = [
  { key: "revenue",   label: "Revenue",   color: "#8b5cf6", format: formatCurrency },
  { key: "mrr",       label: "MRR",       color: "#6366f1", format: formatCurrency },
  { key: "customers", label: "Customers", color: "#10b981", format: (v) => v.toLocaleString() },
];

function ChartTooltip({ active, payload, label, metric }: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
  metric: ChartMetric;
}) {
  if (!active || !payload?.length) return null;
  const opt = CHART_OPTIONS.find((o) => o.key === metric)!;
  return (
    <div className="bg-card border border-border rounded-xl px-4 py-3 shadow-xl">
      <p className="text-[11px] text-muted-foreground mb-1.5 font-medium">{label}</p>
      <p className="text-[15px] font-semibold text-foreground">
        {opt.format(payload[0]?.value || 0)}
      </p>
    </div>
  );
}

interface RevenueChartProps {
  data: RevenueDataPoint[] | undefined;
  isLoading: boolean;
}

export function RevenueChart({ data, isLoading }: RevenueChartProps) {
  const [metric, setMetric] = useState<ChartMetric>("mrr");
  const activeOpt = CHART_OPTIONS.find((o) => o.key === metric)!;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.45 }}
      className="lg:col-span-2 bg-card rounded-xl border border-border p-6 shadow-sm flex flex-col"
    >
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-[15px] font-semibold text-foreground">{activeOpt.label} Growth</h3>
          <p className="text-[12px] text-muted-foreground mt-0.5">12-month trend</p>
        </div>
        <div className="flex items-center gap-1 bg-secondary/60 rounded-lg p-1">
          {CHART_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setMetric(opt.key)}
              className={`px-3 py-1.5 rounded-md text-[12px] font-medium transition-all ${
                metric === opt.key
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="h-[260px] bg-secondary/30 rounded-lg animate-pulse" />
      ) : (
        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data || []} margin={{ top: 10, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={activeOpt.color} stopOpacity={0.25} />
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
                  metric === "customers" ? formatCompactNumber(v) : `$${formatCompactNumber(v)}`
                }
                width={52}
              />
              <Tooltip content={<ChartTooltip metric={metric} />} />
              <Area
                key={metric}
                type="monotone"
                dataKey={metric}
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
  );
}
