import { useGetDashboardMetrics, useGetRevenueChart } from "@workspace/api-client-react";
import { formatCurrency, formatPercentage, formatCompactNumber } from "@/lib/utils";
import { 
  DollarSign, TrendingUp, Users, CreditCard, 
  Activity, Receipt, AlertCircle, Loader2 
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { motion } from "framer-motion";

function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  description,
  delay = 0 
}: { 
  title: string, 
  value: string | number, 
  icon: any, 
  trend?: number, 
  description?: string,
  delay?: number 
}) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="bg-card rounded-xl p-5 border border-border border-t-2 border-t-primary/40 shadow-sm hover:shadow-md transition-all duration-200 relative"
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wide">{title}</h3>
        <div className="text-muted-foreground">
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="flex items-end gap-3 mt-1">
        <div className="text-[28px] leading-tight font-semibold text-foreground tracking-tight">{value}</div>
        {trend !== undefined && (
          <div className={`mb-1 px-1.5 py-0.5 rounded text-[11px] font-semibold ${
            trend >= 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-destructive/10 text-destructive"
          }`}>
            {trend > 0 ? "+" : ""}{formatPercentage(trend * 100)}
          </div>
        )}
      </div>
      {description && <p className="text-[11px] text-muted-foreground mt-2">{description}</p>}
    </motion.div>
  );
}

export default function Dashboard() {
  const { data: metrics, isLoading: loadingMetrics } = useGetDashboardMetrics();
  const { data: chartData, isLoading: loadingChart } = useGetRevenueChart();

  if (loadingMetrics || loadingChart) {
    return (
      <div className="w-full h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-8"
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        <StatCard 
          title="Monthly Recurring Revenue" 
          value={formatCurrency(metrics.mrr)} 
          icon={DollarSign} 
          trend={metrics.mrrGrowthRate} 
          delay={0.05}
        />
        <StatCard 
          title="Total Revenue (MTD)" 
          value={formatCurrency(metrics.totalRevenue)} 
          icon={TrendingUp} 
          delay={0.10}
        />
        <StatCard 
          title="Active Customers" 
          value={metrics.activeCustomers} 
          icon={Users} 
          delay={0.15}
        />
        <StatCard 
          title="Churn Rate" 
          value={formatPercentage(metrics.churnRate * 100)} 
          icon={Activity} 
          trend={-metrics.churnRate} // Just passing it to show red
          delay={0.20}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="lg:col-span-2 bg-card rounded-xl border border-border p-6 shadow-sm flex flex-col"
        >
          <div className="mb-6">
            <h3 className="text-[16px] font-semibold text-foreground">Revenue & MRR Growth</h3>
            <p className="text-[13px] text-muted-foreground mt-1">Monthly trend of top-line revenue vs recurring revenue</p>
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData?.data || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorMrr" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="month" 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                  dy={10}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(val) => `$${formatCompactNumber(val)}`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: 'hsl(var(--foreground))', fontSize: '13px' }}
                  labelStyle={{ color: 'hsl(var(--muted-foreground))', fontSize: '12px', marginBottom: '4px' }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Area type="monotone" dataKey="revenue" stroke="hsl(var(--chart-2))" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
                <Area type="monotone" dataKey="mrr" stroke="hsl(var(--primary))" strokeWidth={2} fillOpacity={1} fill="url(#colorMrr)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Side Metrics */}
        <motion.div 
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="space-y-4"
        >
          <StatCard 
            title="Active Subscriptions" 
            value={metrics.activeSubscriptions} 
            icon={CreditCard} 
            delay={0.35}
          />
          <StatCard 
            title="Avg Revenue Per User" 
            value={formatCurrency(metrics.avgRevenuePerUser)} 
            icon={Receipt} 
            delay={0.4}
          />
          <motion.div 
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.45 }}
            className="bg-card rounded-xl border border-destructive/20 p-5 shadow-sm relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <AlertCircle className="w-24 h-24 text-destructive" />
            </div>
            <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2 relative z-10">Overdue Invoices</h3>
            <div className="text-[28px] font-semibold text-destructive tracking-tight relative z-10 my-1 leading-tight">
              {metrics.overdueInvoices}
            </div>
            <p className="text-[11px] text-muted-foreground relative z-10">
              Out of {metrics.totalInvoices} total open invoices
            </p>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}
