/**
 * Dashboard routes — return financial metrics and chart data.
 * Uses real Stripe data if connected, otherwise returns demo data.
 */

import { Router, type IRouter } from "express";
import { requireAuth } from "../lib/auth";
import {
  fetchStripeMetrics,
  fetchStripeRevenueChart,
  generateDemoMetrics,
  generateDemoRevenueChart,
  generateDemoRevenueBreakdown,
  type CompanyType,
} from "../services/stripeService";

const router: IRouter = Router();

router.use(requireAuth);

/** Returns true when the user should use live Stripe data */
function isLiveMode(user: Express.Request["user"]): boolean {
  return !user.demoMode && !!user.stripeConnected && !!user.stripeApiKey;
}

/** Resolve the active company type for demo mode */
function resolveCompanyType(user: Express.Request["user"]): CompanyType {
  return (user.demoCompanyType as CompanyType) || "saas";
}

/** GET /api/dashboard/metrics — core financial KPIs */
router.get("/metrics", async (req, res) => {
  const { user } = req;
  const companyType = resolveCompanyType(user);

  const metrics = isLiveMode(user)
    ? await fetchStripeMetrics(user.stripeApiKey!)
    : generateDemoMetrics(companyType);

  // Compute MRR growth rate here so the route owns the derived stat
  const mrrGrowthRate =
    metrics.prevMonthMrr > 0
      ? ((metrics.mrr - metrics.prevMonthMrr) / metrics.prevMonthMrr) * 100
      : 0;

  res.json({
    mrr: metrics.mrr,
    mrrGrowthRate,
    totalRevenue: metrics.totalRevenue,
    prevMonthRevenue: metrics.prevMonthRevenue,
    activeCustomers: metrics.activeCustomers,
    prevMonthCustomers: metrics.prevMonthCustomers,
    activeSubscriptions: metrics.activeSubscriptions,
    churnRate: metrics.churnRate,
    avgRevenuePerUser: metrics.avgRevenuePerUser,
    totalInvoices: metrics.totalInvoices,
    overdueInvoices: metrics.overdueInvoices,
    mrrSparkline: metrics.mrrSparkline,
    companyType: metrics.companyType || companyType,
  });
});

/** GET /api/dashboard/revenue-chart — 12 months of MRR/revenue data */
router.get("/revenue-chart", async (req, res) => {
  const { user } = req;
  const companyType = resolveCompanyType(user);

  const data = isLiveMode(user)
    ? await fetchStripeRevenueChart(user.stripeApiKey!)
    : generateDemoRevenueChart(companyType);

  res.json({ data });
});

/** GET /api/dashboard/revenue-breakdown — revenue by plan */
router.get("/revenue-breakdown", (req, res) => {
  const { user } = req;
  const companyType = resolveCompanyType(user);

  // Breakdown requires Stripe product metadata; always use demo data for now
  const breakdown = generateDemoRevenueBreakdown(companyType);
  res.json(breakdown);
});

export default router;
