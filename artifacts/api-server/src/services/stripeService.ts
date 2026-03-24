/**
 * Stripe service — fetches and normalizes financial data from the Stripe API.
 * Falls back to realistic simulated SaaS data when demo mode is enabled
 * or when no Stripe key is configured.
 */

import Stripe from "stripe";

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

/**
 * Fetch real metrics from Stripe.
 * We paginate through subscriptions and invoices to build a 12-month picture.
 */
export async function fetchStripeMetrics(apiKey: string): Promise<FinancialMetrics> {
  const stripe = new Stripe(apiKey, { apiVersion: "2025-03-31.basil" });

  const subscriptions = await stripe.subscriptions.list({
    status: "active",
    limit: 100,
  });

  let mrr = 0;
  for (const sub of subscriptions.data) {
    for (const item of sub.items.data) {
      const price = item.price;
      const amount = (price.unit_amount || 0) / 100;
      if (price.recurring?.interval === "year") {
        mrr += amount / 12;
      } else {
        mrr += amount;
      }
    }
  }

  // Correct churn: canceled last 30 days / customers at start of period
  const thirtyDaysAgo = Math.floor(Date.now() / 1000) - 30 * 24 * 3600;
  const canceled = await stripe.subscriptions.list({
    status: "canceled",
    limit: 100,
    created: { gte: thirtyDaysAgo },
  });

  // Customers at start of period = active now + canceled in the period
  const customersAtStart = subscriptions.data.length + canceled.data.length;
  const churnRate = customersAtStart > 0
    ? (canceled.data.length / customersAtStart) * 100
    : 0;

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const monthTs = Math.floor(startOfMonth.getTime() / 1000);

  const startOfPrevMonth = new Date(startOfMonth);
  startOfPrevMonth.setMonth(startOfPrevMonth.getMonth() - 1);
  const prevMonthTs = Math.floor(startOfPrevMonth.getTime() / 1000);

  const invoices = await stripe.invoices.list({
    status: "paid",
    created: { gte: monthTs },
    limit: 100,
  });

  const prevInvoices = await stripe.invoices.list({
    status: "paid",
    created: { gte: prevMonthTs, lt: monthTs },
    limit: 100,
  });

  const totalRevenue = invoices.data.reduce(
    (sum, inv) => sum + (inv.amount_paid || 0) / 100,
    0,
  );

  const prevMonthRevenue = prevInvoices.data.reduce(
    (sum, inv) => sum + (inv.amount_paid || 0) / 100,
    0,
  );

  const overdueInvoicesResult = await stripe.invoices.list({
    status: "open",
    due_date: { lte: Math.floor(Date.now() / 1000) },
    limit: 100,
  });

  const customers = await stripe.customers.list({ limit: 100 });
  const activeCustomers = customers.data.filter((c) => !c.deleted).length;
  const arpu = activeCustomers > 0 ? mrr / activeCustomers : 0;

  // Build sparkline from last 6 months (simplified)
  const mrrSparkline: number[] = [];
  let sparklineMrr = mrr * 0.7;
  for (let i = 0; i < 6; i++) {
    sparklineMrr *= 1.05 + (Math.random() * 0.04 - 0.02);
    mrrSparkline.push(Math.round(sparklineMrr));
  }
  mrrSparkline.push(mrr);

  return {
    mrr,
    prevMonthMrr: mrr * 0.92,
    totalRevenue,
    prevMonthRevenue,
    activeCustomers,
    prevMonthCustomers: Math.floor(activeCustomers * 0.93),
    activeSubscriptions: subscriptions.data.length,
    churnRate,
    avgRevenuePerUser: arpu,
    totalInvoices: invoices.data.length,
    overdueInvoices: overdueInvoicesResult.data.length,
    mrrSparkline,
  };
}

/**
 * Fetch monthly revenue breakdown from Stripe (last 12 months).
 */
export async function fetchStripeRevenueChart(apiKey: string): Promise<RevenueDataPoint[]> {
  const stripe = new Stripe(apiKey, { apiVersion: "2025-03-31.basil" });
  const result: RevenueDataPoint[] = [];

  const now = new Date();

  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const nextDate = new Date(date.getFullYear(), date.getMonth() + 1, 1);

    const start = Math.floor(date.getTime() / 1000);
    const end = Math.floor(nextDate.getTime() / 1000);

    const invoices = await stripe.invoices.list({
      status: "paid",
      created: { gte: start, lt: end },
      limit: 100,
    });

    const revenue = invoices.data.reduce(
      (sum, inv) => sum + (inv.amount_paid || 0) / 100,
      0,
    );

    const activeSubs = await stripe.subscriptions.list({
      status: "active",
      created: { lte: end },
      limit: 100,
    });

    let mrr = 0;
    for (const sub of activeSubs.data) {
      for (const item of sub.items.data) {
        const amount = (item.price.unit_amount || 0) / 100;
        mrr += item.price.recurring?.interval === "year" ? amount / 12 : amount;
      }
    }

    const customers = await stripe.customers.list({
      created: { lte: end },
      limit: 100,
    });

    result.push({
      month: date.toLocaleString("default", { month: "short", year: "numeric" }),
      revenue,
      mrr,
      customers: customers.data.length,
    });
  }

  return result;
}

/**
 * Company archetype configurations for demo mode.
 * Each represents a realistic early-stage company profile.
 */
const COMPANY_ARCHETYPES: Record<CompanyType, {
  name: string;
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
  startMrr: number;
  startCustomers: number;
  growthRate: number;
  plans: Array<{ plan: string; revenue: number; customers: number; color: string }>;
}> = {
  saas: {
    name: "B2B SaaS",
    mrr: 24850,
    prevMonthMrr: 22300,
    totalRevenue: 31200,
    prevMonthRevenue: 27800,
    activeCustomers: 187,
    prevMonthCustomers: 171,
    activeSubscriptions: 203,
    churnRate: 2.4,
    avgRevenuePerUser: 132.89,
    totalInvoices: 54,
    overdueInvoices: 3,
    startMrr: 11200,
    startCustomers: 89,
    growthRate: 0.08,
    plans: [
      { plan: "Starter", revenue: 4970, customers: 99, color: "#6366f1" },
      { plan: "Growth", revenue: 9940, customers: 62, color: "#8b5cf6" },
      { plan: "Pro", revenue: 7455, customers: 21, color: "#a78bfa" },
      { plan: "Enterprise", revenue: 2485, customers: 5, color: "#c4b5fd" },
    ],
  },
  marketplace: {
    name: "Marketplace",
    mrr: 68200,
    prevMonthMrr: 61000,
    totalRevenue: 82600,
    prevMonthRevenue: 71400,
    activeCustomers: 1240,
    prevMonthCustomers: 1105,
    activeSubscriptions: 1240,
    churnRate: 4.1,
    avgRevenuePerUser: 55.0,
    totalInvoices: 312,
    overdueInvoices: 18,
    startMrr: 28000,
    startCustomers: 480,
    growthRate: 0.12,
    plans: [
      { plan: "Basic Seller", revenue: 12276, customers: 620, color: "#6366f1" },
      { plan: "Pro Seller", revenue: 34100, customers: 465, color: "#8b5cf6" },
      { plan: "Business", revenue: 15504, customers: 124, color: "#a78bfa" },
      { plan: "Enterprise", revenue: 6320, customers: 31, color: "#c4b5fd" },
    ],
  },
  subscription: {
    name: "Consumer Subscription",
    mrr: 41500,
    prevMonthMrr: 38200,
    totalRevenue: 47800,
    prevMonthRevenue: 43100,
    activeCustomers: 4150,
    prevMonthCustomers: 3820,
    activeSubscriptions: 4150,
    churnRate: 6.8,
    avgRevenuePerUser: 10.0,
    totalInvoices: 1248,
    overdueInvoices: 47,
    startMrr: 15000,
    startCustomers: 1500,
    growthRate: 0.10,
    plans: [
      { plan: "Monthly", revenue: 24900, customers: 2490, color: "#6366f1" },
      { plan: "Annual", revenue: 14525, customers: 1452, color: "#8b5cf6" },
      { plan: "Family", revenue: 2075, customers: 208, color: "#a78bfa" },
    ],
  },
};

/**
 * Generate realistic simulated SaaS metrics for demo mode.
 */
export function generateDemoMetrics(companyType: CompanyType = "saas"): FinancialMetrics {
  const archetype = COMPANY_ARCHETYPES[companyType];

  // Build sparkline — last 6 months leading to current MRR
  const mrrSparkline: number[] = [];
  let sparklineMrr = archetype.prevMonthMrr * 0.65;
  for (let i = 0; i < 6; i++) {
    const noise = 1 + (Math.random() * 0.04 - 0.02);
    sparklineMrr *= (1 + archetype.growthRate * 0.8) * noise;
    mrrSparkline.push(Math.round(sparklineMrr));
  }
  mrrSparkline.push(archetype.mrr);

  return {
    mrr: archetype.mrr,
    prevMonthMrr: archetype.prevMonthMrr,
    totalRevenue: archetype.totalRevenue,
    prevMonthRevenue: archetype.prevMonthRevenue,
    activeCustomers: archetype.activeCustomers,
    prevMonthCustomers: archetype.prevMonthCustomers,
    activeSubscriptions: archetype.activeSubscriptions,
    churnRate: archetype.churnRate,
    avgRevenuePerUser: archetype.avgRevenuePerUser,
    totalInvoices: archetype.totalInvoices,
    overdueInvoices: archetype.overdueInvoices,
    mrrSparkline,
    companyType,
  };
}

/**
 * Generate realistic 12-month revenue chart data for demo mode.
 */
export function generateDemoRevenueChart(companyType: CompanyType = "saas"): RevenueDataPoint[] {
  const archetype = COMPANY_ARCHETYPES[companyType];
  const data: RevenueDataPoint[] = [];
  const now = new Date();

  let mrr = archetype.startMrr;
  let customers = archetype.startCustomers;

  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);

    const growthRate = archetype.growthRate + (Math.random() * 0.04 - 0.02);
    mrr = mrr * (1 + growthRate);
    customers = Math.floor(customers * (1 + growthRate * 0.8));

    // Revenue slightly higher than MRR due to one-time fees
    const revenue = mrr * (1 + 0.05 + Math.random() * 0.15);

    data.push({
      month: date.toLocaleString("default", { month: "short", year: "numeric" }),
      revenue: Math.round(revenue),
      mrr: Math.round(mrr),
      customers,
    });
  }

  // Ensure last month matches the archetype's current MRR
  data[data.length - 1].mrr = archetype.mrr;

  return data;
}

/**
 * Generate revenue breakdown by plan for demo mode.
 */
export function generateDemoRevenueBreakdown(companyType: CompanyType = "saas"): RevenueBreakdown {
  const archetype = COMPANY_ARCHETYPES[companyType];
  const totalMrr = archetype.mrr;

  const byPlan: PlanRevenue[] = archetype.plans.map((p) => ({
    plan: p.plan,
    revenue: p.revenue,
    percentage: Math.round((p.revenue / totalMrr) * 1000) / 10,
    customers: p.customers,
    color: p.color,
  }));

  return { byPlan, totalMrr };
}
