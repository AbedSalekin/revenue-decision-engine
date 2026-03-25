/** Shared types for Stripe data and demo data. */

export interface FinancialMetrics {
  mrr: number;
  prevMonthMrr: number;
  totalRevenue: number;
  prevMonthRevenue: number;
  activeCustomers: number;
  prevMonthCustomers: number;
  activeSubscriptions: number;
  churnRate: number;
  avgRevenuePerUser: number;
  totalInvoices: number;
  overdueInvoices: number;
  mrrSparkline: number[];
  companyType?: string;
}

export interface RevenueDataPoint {
  month: string;
  revenue: number;
  mrr: number;
  customers: number;
}

export interface PlanRevenue {
  plan: string;
  revenue: number;
  percentage: number;
  customers: number;
  color: string;
}

export interface RevenueBreakdown {
  byPlan: PlanRevenue[];
  totalMrr: number;
}

export type CompanyType = "saas" | "marketplace" | "subscription";
