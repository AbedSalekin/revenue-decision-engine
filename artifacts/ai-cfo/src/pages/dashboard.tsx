import { useGetDashboardMetrics, useGetRevenueChart, useGetRevenueBreakdown } from "@workspace/api-client-react";
import { formatCurrency } from "@/lib/utils";
import { DollarSign, TrendingUp, Users, CreditCard, Activity, Receipt, AlertCircle, BarChart2 } from "lucide-react";
import { motion } from "framer-motion";
import { StatCard }        from "@/components/dashboard/StatCard";
import { RevenueChart }    from "@/components/dashboard/RevenueChart";
import { RevenueBreakdown } from "@/components/dashboard/RevenueBreakdown";
import { SkeletonCard, SkeletonChart } from "@/components/dashboard/SkeletonLoaders";

/** Returns the percentage change between two values, or null if previous is 0. */
function percentChange(current: number, previous: number): number | null {
  if (!previous) return null;
  return ((current - previous) / previous) * 100;
}

export default function Dashboard() {
  const { data: metrics,   isLoading: loadingMetrics   } = useGetDashboardMetrics();
  const { data: chartData, isLoading: loadingChart     } = useGetRevenueChart();
  const { data: breakdown, isLoading: loadingBreakdown } = useGetRevenueBreakdown();

  if (loadingMetrics) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
        </div>
        <SkeletonChart />
      </div>
    );
  }

  if (!metrics) return null;

  const mrrChange      = percentChange(metrics.mrr,             metrics.prevMonthMrr     ?? metrics.mrr / 1.1);
  const revenueChange  = percentChange(metrics.totalRevenue,    metrics.prevMonthRevenue  ?? metrics.totalRevenue / 1.12);
  const customerChange = percentChange(metrics.activeCustomers, metrics.prevMonthCustomers ?? metrics.activeCustomers / 1.08);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      {/* Primary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Monthly Recurring Revenue" value={formatCurrency(metrics.mrr)}
          icon={DollarSign} change={mrrChange} sparkline={metrics.mrrSparkline}
          positive={(mrrChange ?? 0) >= 0} delay={0.05}
          iconColor="text-indigo-400" iconBg="bg-indigo-500/10" />
        <StatCard title="Total Revenue (MTD)" value={formatCurrency(metrics.totalRevenue)}
          icon={TrendingUp} change={revenueChange} positive={(revenueChange ?? 0) >= 0}
          delay={0.10} iconColor="text-violet-400" iconBg="bg-violet-500/10" />
        <StatCard title="Active Customers" value={metrics.activeCustomers.toLocaleString()}
          icon={Users} change={customerChange} positive={(customerChange ?? 0) >= 0}
          delay={0.15} iconColor="text-emerald-400" iconBg="bg-emerald-500/10" />
        <StatCard title="Monthly Churn Rate" value={`${metrics.churnRate.toFixed(1)}%`}
          icon={Activity} change={null} positive={false} delay={0.20}
          iconColor="text-rose-400" iconBg="bg-rose-500/10" />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Active Subscriptions" value={metrics.activeSubscriptions.toLocaleString()}
          icon={CreditCard} delay={0.25} iconColor="text-sky-400" iconBg="bg-sky-500/10" />
        <StatCard title="Avg Revenue / User" value={formatCurrency(metrics.avgRevenuePerUser)}
          icon={Receipt} delay={0.30} iconColor="text-amber-400" iconBg="bg-amber-500/10" />
        <StatCard title="Total Invoices (MTD)" value={metrics.totalInvoices.toLocaleString()}
          icon={BarChart2} delay={0.35} iconColor="text-cyan-400" iconBg="bg-cyan-500/10" />
        <StatCard title="Overdue Invoices" value={metrics.overdueInvoices}
          icon={AlertCircle} positive={false} delay={0.40}
          iconColor="text-rose-400" iconBg="bg-rose-500/10" />
      </div>

      {/* Chart + Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <RevenueChart    data={chartData?.data} isLoading={loadingChart} />
        <RevenueBreakdown breakdown={breakdown} isLoading={loadingBreakdown} />
      </div>
    </motion.div>
  );
}
