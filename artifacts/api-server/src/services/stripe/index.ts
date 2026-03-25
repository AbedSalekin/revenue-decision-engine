/** Re-exports for the Stripe service module. */

export type { FinancialMetrics, RevenueDataPoint, PlanRevenue, RevenueBreakdown, CompanyType } from "./types";
export { fetchStripeMetrics, fetchStripeRevenueChart } from "./client";
export { generateDemoMetrics, generateDemoRevenueChart, generateDemoRevenueBreakdown } from "./demoData";
