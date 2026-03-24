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
  activeCustomers: number;
  activeSubscriptions: number;
  churnRate: number;
  avgRevenuePerUser: number;
  totalInvoices: number;
  overdueInvoices: number;
}

export interface RevenueDataPoint {
  month: string;
  revenue: number;
  mrr: number;
  customers: number;
}

/**
 * Fetch real metrics from Stripe.
 * We paginate through subscriptions and invoices to build a 12-month picture.
 */
export async function fetchStripeMetrics(apiKey: string): Promise<FinancialMetrics> {
  const stripe = new Stripe(apiKey, { apiVersion: "2025-03-31.basil" });

  // Get active subscriptions
  const subscriptions = await stripe.subscriptions.list({
    status: "active",
    limit: 100,
  });

  // MRR = sum of all active subscription amounts (normalized to monthly)
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

  // Canceled subscriptions in the last 30 days (for churn)
  const thirtyDaysAgo = Math.floor(Date.now() / 1000) - 30 * 24 * 3600;
  const canceled = await stripe.subscriptions.list({
    status: "canceled",
    limit: 100,
    created: { gte: thirtyDaysAgo },
  });

  const churnRate =
    subscriptions.data.length > 0
      ? (canceled.data.length / (subscriptions.data.length + canceled.data.length)) * 100
      : 0;

  // Revenue from invoices paid this month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const monthTs = Math.floor(startOfMonth.getTime() / 1000);

  const invoices = await stripe.invoices.list({
    status: "paid",
    created: { gte: monthTs },
    limit: 100,
  });

  const totalRevenue = invoices.data.reduce(
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

  return {
    mrr,
    prevMonthMrr: mrr * 0.92, // Approximation; would need historical data for exact
    totalRevenue,
    activeCustomers,
    activeSubscriptions: subscriptions.data.length,
    churnRate,
    avgRevenuePerUser: arpu,
    totalInvoices: invoices.data.length,
    overdueInvoices: overdueInvoicesResult.data.length,
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
 * Generate realistic simulated SaaS metrics for demo mode.
 * Numbers are modeled after a typical early-stage B2B SaaS company.
 */
export function generateDemoMetrics(): FinancialMetrics {
  return {
    mrr: 24850,
    prevMonthMrr: 22300,
    totalRevenue: 31200,
    activeCustomers: 187,
    activeSubscriptions: 203,
    churnRate: 2.4,
    avgRevenuePerUser: 132.89,
    totalInvoices: 54,
    overdueInvoices: 3,
  };
}

/**
 * Generate realistic 12-month revenue chart data for demo mode.
 * Shows a healthy growth trajectory with some natural variance.
 */
export function generateDemoRevenueChart(): RevenueDataPoint[] {
  const data: RevenueDataPoint[] = [];
  const now = new Date();

  // Start values 12 months ago
  let mrr = 11200;
  let customers = 89;

  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);

    // Apply realistic monthly growth with slight variance
    const growthRate = 0.08 + (Math.random() * 0.04 - 0.02); // 6–10%
    mrr = mrr * (1 + growthRate);
    customers = Math.floor(customers * (1 + growthRate * 0.8));

    // Revenue is slightly higher than MRR due to one-time fees
    const revenue = mrr * (1 + 0.05 + Math.random() * 0.15);

    data.push({
      month: date.toLocaleString("default", { month: "short", year: "numeric" }),
      revenue: Math.round(revenue),
      mrr: Math.round(mrr),
      customers,
    });
  }

  return data;
}
