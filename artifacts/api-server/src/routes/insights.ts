/**
 * AI Insights routes — generate and retrieve AI-powered financial insights.
 * Orchestrates Stripe data collection and OpenAI calls via service layer.
 */

import { Router, type IRouter } from "express";
import { db, insightsTable } from "@workspace/db";
import { eq, desc, inArray } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import { isLiveMode, resolveCompanyType } from "../lib/userHelpers";
import { fetchStripeMetrics, fetchStripeRevenueChart, generateDemoMetrics, generateDemoRevenueChart } from "../services/stripe";
import { generateAIInsights, generateWeeklyActions } from "../services/insights";

const router: IRouter = Router();

router.use(requireAuth);

/** Resolve metrics and chart data for the current user (live or demo). */
async function loadMetrics(user: Express.Request["user"]) {
  if (isLiveMode(user)) {
    const [metrics, chartData] = await Promise.all([
      fetchStripeMetrics(user.stripeApiKey!),
      fetchStripeRevenueChart(user.stripeApiKey!),
    ]);
    return { metrics, chartData };
  }

  const companyType = resolveCompanyType(user);
  return {
    metrics:   generateDemoMetrics(companyType),
    chartData: generateDemoRevenueChart(companyType),
  };
}

const MAX_INSIGHTS_PER_USER = 10;

/** GET /api/insights/latest — retrieve stored insights (most recent) */
router.get("/latest", async (req, res) => {
  const { user } = req;

  const rows = await db
    .select()
    .from(insightsTable)
    .where(eq(insightsTable.userId, user.id))
    .orderBy(desc(insightsTable.generatedAt))
    .limit(1);

  if (!rows[0]) {
    res.json({
      forecast:           { summary: "", months: [] },
      risks:              { summary: "", items: [] },
      opportunities:      { summary: "", items: [] },
      recommendedActions: { summary: "", items: [] },
      generatedAt: null,
    });
    return;
  }

  res.json(rows[0].insightsData);
});

/** POST /api/insights/generate — call OpenAI and persist fresh insights */
router.post("/generate", async (req, res) => {
  const { user } = req;
  const { metrics, chartData } = await loadMetrics(user);
  const insights = await generateAIInsights(metrics, chartData);

  await db.insert(insightsTable).values({ userId: user.id, insightsData: insights });

  // Keep only the most recent N records per user to avoid unbounded growth
  const all = await db
    .select({ id: insightsTable.id })
    .from(insightsTable)
    .where(eq(insightsTable.userId, user.id))
    .orderBy(desc(insightsTable.generatedAt));

  if (all.length > MAX_INSIGHTS_PER_USER) {
    const idsToDelete = all.slice(MAX_INSIGHTS_PER_USER).map((r) => r.id);
    await db.delete(insightsTable).where(inArray(insightsTable.id, idsToDelete));
  }

  res.json(insights);
});

/** POST /api/insights/weekly-actions — generate this week's priorities */
router.post("/weekly-actions", async (req, res) => {
  const { user } = req;
  const { metrics, chartData } = await loadMetrics(user);
  const result = await generateWeeklyActions(metrics, chartData);
  res.json(result);
});

export default router;
