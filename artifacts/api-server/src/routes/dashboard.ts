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
} from "../services/stripeService";

const router: IRouter = Router();

router.use(requireAuth);

/** GET /api/dashboard/metrics — core financial KPIs */
router.get("/metrics", async (req, res) => {
  const user = (req as any).user;

  let metrics;
  if (!user.demoMode && user.stripeConnected && user.stripeApiKey) {
    // Fetch real data from Stripe
    metrics = await fetchStripeMetrics(user.stripeApiKey);
  } else {
    // Return demo data
    metrics = generateDemoMetrics();
  }

  const mrrGrowthRate =
    metrics.prevMonthMrr > 0
      ? ((metrics.mrr - metrics.prevMonthMrr) / metrics.prevMonthMrr) * 100
      : 0;

  res.json({
    mrr: metrics.mrr,
    mrrGrowthRate,
    totalRevenue: metrics.totalRevenue,
    activeCustomers: metrics.activeCustomers,
    activeSubscriptions: metrics.activeSubscriptions,
    churnRate: metrics.churnRate,
    avgRevenuePerUser: metrics.avgRevenuePerUser,
    totalInvoices: metrics.totalInvoices,
    overdueInvoices: metrics.overdueInvoices,
  });
});

/** GET /api/dashboard/revenue-chart — 12 months of MRR/revenue data */
router.get("/revenue-chart", async (req, res) => {
  const user = (req as any).user;

  let data;
  if (!user.demoMode && user.stripeConnected && user.stripeApiKey) {
    data = await fetchStripeRevenueChart(user.stripeApiKey);
  } else {
    data = generateDemoRevenueChart();
  }

  res.json({ data });
});

export default router;
