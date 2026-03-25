import { motion } from "framer-motion";
import { formatCurrency } from "@/lib/utils";

interface PlanRevenue {
  plan: string;
  revenue: number;
  percentage: number;
  customers: number;
  color: string;
}

interface BreakdownBarProps extends PlanRevenue {}

function BreakdownBar({ plan, revenue, percentage, customers, color }: BreakdownBarProps) {
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

interface RevenueBreakdownProps {
  breakdown: { byPlan: PlanRevenue[]; totalMrr: number } | undefined;
  isLoading: boolean;
}

export function RevenueBreakdown({ breakdown, isLoading }: RevenueBreakdownProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.5 }}
      className="bg-card rounded-xl border border-border p-6 shadow-sm"
    >
      <div className="mb-5">
        <h3 className="text-[15px] font-semibold text-foreground">Revenue by Plan</h3>
        <p className="text-[12px] text-muted-foreground mt-0.5">
          {breakdown ? `${formatCurrency(breakdown.totalMrr)} total MRR` : "—"}
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-3 w-24 bg-secondary rounded mb-2" />
              <div className="h-2 bg-secondary rounded-full" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-5">
          {(breakdown?.byPlan || []).map((plan) => (
            <BreakdownBar key={plan.plan} {...plan} />
          ))}
        </div>
      )}
    </motion.div>
  );
}
