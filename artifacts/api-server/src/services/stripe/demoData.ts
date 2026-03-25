/**
 * Demo data generation for the three supported company archetypes.
 * Used when a user is in demo mode or has not connected Stripe.
 */

import type { CompanyType, FinancialMetrics, RevenueDataPoint, RevenueBreakdown, PlanRevenue } from "./types";

interface Archetype {
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
}

const COMPANY_ARCHETYPES: Record<CompanyType, Archetype> = {
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
      { plan: "Starter",    revenue: 4970,  customers: 99, color: "#6366f1" },
      { plan: "Growth",     revenue: 9940,  customers: 62, color: "#8b5cf6" },
      { plan: "Pro",        revenue: 7455,  customers: 21, color: "#a78bfa" },
      { plan: "Enterprise", revenue: 2485,  customers: 5,  color: "#c4b5fd" },
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
      { plan: "Basic Seller",  revenue: 12276, customers: 620, color: "#6366f1" },
      { plan: "Pro Seller",    revenue: 34100, customers: 465, color: "#8b5cf6" },
      { plan: "Business",      revenue: 15504, customers: 124, color: "#a78bfa" },
      { plan: "Enterprise",    revenue: 6320,  customers: 31,  color: "#c4b5fd" },
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
      { plan: "Annual",  revenue: 14525, customers: 1452, color: "#8b5cf6" },
      { plan: "Family",  revenue: 2075,  customers: 208,  color: "#a78bfa" },
    ],
  },
};

export function generateDemoMetrics(companyType: CompanyType = "saas"): FinancialMetrics {
  const archetype = COMPANY_ARCHETYPES[companyType];

  // Build a 7-point sparkline leading up to current MRR
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

    // Revenue is slightly above MRR due to one-time fees and overages
    const revenue = mrr * (1 + 0.05 + Math.random() * 0.15);

    data.push({
      month: date.toLocaleString("default", { month: "short", year: "numeric" }),
      revenue: Math.round(revenue),
      mrr: Math.round(mrr),
      customers,
    });
  }

  // Pin the final month to the archetype's exact MRR
  data[data.length - 1].mrr = archetype.mrr;

  return data;
}

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
