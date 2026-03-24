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

/** GET /api/dashboard/metrics — core financial KPIs */
router.get("/metrics", async (req, res) => {
  const user = (req as any).user;
  const companyType: CompanyType = (user.demoCompanyType as CompanyType) || "saas";

  let metrics;
  if (!user.demoMode && user.stripeConnected && user.stripeApiKey) {
    metrics = await fetchStripeMetrics(user.stripeApiKey);
  } else {
    metrics = generateDemoMetrics(companyType);
  }

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
  const user = (req as any).user;
  const companyType: CompanyType = (user.demoCompanyType as CompanyType) || "saas";

  let data;
  if (!user.demoMode && user.stripeConnected && user.stripeApiKey) {
    data = await fetchStripeRevenueChart(user.stripeApiKey);
  } else {
    data = generateDemoRevenueChart(companyType);
  }

  res.json({ data });
});

/** GET /api/dashboard/revenue-breakdown — revenue breakdown by plan */
router.get("/revenue-breakdown", async (req, res) => {
  const user = (req as any).user;
  const companyType: CompanyType = (user.demoCompanyType as CompanyType) || "saas";

  // For now, always use demo breakdown — Stripe breakdown requires product metadata
  const breakdown = generateDemoRevenueBreakdown(companyType);
  res.json(breakdown);
});

export default router;
