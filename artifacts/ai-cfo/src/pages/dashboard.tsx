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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="bg-card rounded-2xl p-6 border border-border shadow-sm hover:shadow-xl hover:border-primary/30 transition-all duration-300"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-primary">
          <Icon className="w-6 h-6" />
        </div>
        {trend !== undefined && (
          <div className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
            trend >= 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-destructive/10 text-destructive"
          }`}>
            {trend > 0 ? "+" : ""}{formatPercentage(trend * 100)}
          </div>
        )}
      </div>
      <h3 className="text-muted-foreground font-medium text-sm mb-1">{title}</h3>
      <div className="text-3xl font-display font-bold text-foreground tracking-tight">{value}</div>
      {description && <p className="text-xs text-muted-foreground mt-2">{description}</p>}
    </motion.div>
  );
}

export default function Dashboard() {
  const { data: metrics, isLoading: loadingMetrics } = useGetDashboardMetrics();
  const { data: chartData, isLoading: loadingChart } = useGetRevenueChart();

  if (loadingMetrics || loadingChart) {
    return (
      <div className="w-full h-[60vh] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Monthly Recurring Revenue" 
          value={formatCurrency(metrics.mrr)} 
          icon={DollarSign} 
          trend={metrics.mrrGrowthRate} 
          delay={0.1}
        />
        <StatCard 
          title="Total Revenue (MTD)" 
          value={formatCurrency(metrics.totalRevenue)} 
          icon={TrendingUp} 
          delay={0.2}
        />
        <StatCard 
          title="Active Customers" 
          value={metrics.activeCustomers} 
          icon={Users} 
          delay={0.3}
        />
        <StatCard 
          title="Churn Rate" 
          value={formatPercentage(metrics.churnRate * 100)} 
          icon={Activity} 
          trend={-metrics.churnRate} // Just passing it to show red
          delay={0.4}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="lg:col-span-2 bg-card rounded-2xl border border-border p-6 shadow-lg"
        >
          <h3 className="text-lg font-display font-bold text-foreground mb-6">Revenue & MRR Growth</h3>
          <div className="h-[350px] w-full">
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
                  contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', borderRadius: '12px', color: 'hsl(var(--popover-foreground))' }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Area type="monotone" dataKey="revenue" stroke="hsl(var(--chart-2))" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
                <Area type="monotone" dataKey="mrr" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorMrr)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Side Metrics */}
        <div className="space-y-6">
          <StatCard 
            title="Active Subscriptions" 
            value={metrics.activeSubscriptions} 
            icon={CreditCard} 
            delay={0.6}
          />
          <StatCard 
            title="Average Revenue Per User" 
            value={formatCurrency(metrics.avgRevenuePerUser)} 
            icon={Receipt} 
            delay={0.7}
          />
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="bg-gradient-to-br from-card to-secondary/30 rounded-2xl border border-border p-6 shadow-sm relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <AlertCircle className="w-24 h-24 text-destructive" />
            </div>
            <h3 className="text-muted-foreground font-medium text-sm mb-1 relative z-10">Overdue Invoices</h3>
            <div className="text-4xl font-display font-bold text-destructive tracking-tight relative z-10 my-2">
              {metrics.overdueInvoices}
            </div>
            <p className="text-sm text-muted-foreground relative z-10">
              Out of {metrics.totalInvoices} total open invoices
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
