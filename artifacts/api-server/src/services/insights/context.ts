/**
 * Builds the structured financial context object sent to OpenAI.
 * Rich JSON context gives the model concrete numbers to reason about.
 */

import type { FinancialMetrics, RevenueDataPoint } from "../stripe/types";

export function buildFinancialContext(
  metrics: FinancialMetrics,
  chartData: RevenueDataPoint[],
): object {
  const pctChange = (current: number, previous: number) =>
    previous > 0 ? (((current - previous) / previous) * 100).toFixed(1) : "N/A";

  const mrrGrowthRate     = pctChange(metrics.mrr,             metrics.prevMonthMrr);
  const revenueGrowthRate = pctChange(metrics.totalRevenue,    metrics.prevMonthRevenue);
  const customerGrowthRate= pctChange(metrics.activeCustomers, metrics.prevMonthCustomers);

  const last6Months = chartData.slice(-6).map(({ month, mrr, revenue, customers }) => ({
    month, mrr, revenue, customers,
  }));

  // 3-month average growth for the trend section
  const last3 = chartData.slice(-3);
  const avgMoMGrowth =
    last3.length >= 2
      ? pctChange(last3[last3.length - 1].mrr, last3[0].mrr)
      : "N/A";

  return {
    asOf: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
    companyType: metrics.companyType || "saas",
    currentMetrics: {
      mrr:                  metrics.mrr,
      mrrGrowthMoM:         `${mrrGrowthRate}%`,
      totalRevenueMTD:      metrics.totalRevenue,
      revenueGrowthMoM:     `${revenueGrowthRate}%`,
      activeCustomers:      metrics.activeCustomers,
      customerGrowthMoM:    `${customerGrowthRate}%`,
      activeSubscriptions:  metrics.activeSubscriptions,
      churnRate:            `${metrics.churnRate.toFixed(1)}%`,
      arpu:                 metrics.avgRevenuePerUser,
      overdueInvoices:      metrics.overdueInvoices,
      totalInvoices:        metrics.totalInvoices,
    },
    recentTrend: {
      last6Months,
      avgMoMGrowthLast3Months: `${avgMoMGrowth}%`,
    },
  };
}
