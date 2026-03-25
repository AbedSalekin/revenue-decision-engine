import type { ElementType } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { motion } from "framer-motion";
import { Sparkline } from "./Sparkline";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ElementType;
  change?: number | null;
  sparkline?: number[];
  positive?: boolean;
  delay?: number;
  iconColor?: string;
  iconBg?: string;
}

/** Formats a number as a signed percentage string (e.g. +12.3% or -4.1%). */
function formatChange(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  change,
  sparkline,
  positive = true,
  delay = 0,
  iconColor = "text-primary",
  iconBg = "bg-primary/10",
}: StatCardProps) {
  const hasChange = change !== undefined && change !== null;
  const isUp   = hasChange && change! >= 0;
  const isDown = hasChange && change! < 0;

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
        <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">
          {title}
        </p>
        {hasChange && (
          <span
            className={`text-[11px] font-semibold flex items-center gap-0.5 ${
              isUp ? "text-emerald-500" : isDown ? "text-rose-500" : "text-muted-foreground"
            }`}
          >
            {isUp   && <TrendingUp   className="w-3 h-3" />}
            {isDown && <TrendingDown className="w-3 h-3" />}
            {formatChange(change!)} vs last mo
          </span>
        )}
      </div>
    </motion.div>
  );
}
