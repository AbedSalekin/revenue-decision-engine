/**
 * AI Insights routes — generate and retrieve AI-powered financial insights.
 * Orchestrates Stripe data collection and OpenAI calls.
 */

import { Router, type IRouter } from "express";
import { db, usersTable, insightsTable } from "@workspace/db";
import { eq, desc, inArray } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import {
  fetchStripeMetrics,
  fetchStripeRevenueChart,
  generateDemoMetrics,
  generateDemoRevenueChart,
  type CompanyType,
} from "../services/stripeService";
import { generateAIInsights, generateWeeklyActions } from "../services/insightsService";

const router: IRouter = Router();

router.use(requireAuth);

/** Returns true when the user should use live Stripe data */
function isLiveMode(user: Express.Request["user"]): boolean {
  return !user.demoMode && !!user.stripeConnected && !!user.stripeApiKey;
}

/**
 * Resolve metrics and chart data for the current user.
 * Respects demo mode and company type.
 */
async function getMetricsForUser(user: Express.Request["user"]) {
  if (isLiveMode(user)) {
    const [metrics, chartData] = await Promise.all([
      fetchStripeMetrics(user.stripeApiKey!),
      fetchStripeRevenueChart(user.stripeApiKey!),
    ]);
    return { metrics, chartData };
  }

  // Demo mode: use the selected company archetype
  const companyType = (user.demoCompanyType as CompanyType) || "saas";
  return {
    metrics: generateDemoMetrics(companyType),
    chartData: generateDemoRevenueChart(companyType),
  };
}

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
    // Return empty structure when no insights have been generated yet
    res.json({
      forecast: { summary: "", months: [] },
      risks: { summary: "", items: [] },
      opportunities: { summary: "", items: [] },
      recommendedActions: { summary: "", items: [] },
      generatedAt: null,
    });
    return;
  }

  res.json(rows[0].insightsData);
});

/** POST /api/insights/generate — call OpenAI and store fresh insights */
router.post("/generate", async (req, res) => {
  const { user } = req;

  const { metrics, chartData } = await getMetricsForUser(user);
  const insights = await generateAIInsights(metrics, chartData);

  // Persist to DB
  await db.insert(insightsTable).values({
    userId: user.id,
    insightsData: insights,
  });

  // Prune old records — keep the 10 most recent per user
  const all = await db
    .select({ id: insightsTable.id })
    .from(insightsTable)
    .where(eq(insightsTable.userId, user.id))
    .orderBy(desc(insightsTable.generatedAt));

  if (all.length > 10) {
    const idsToDelete = all.slice(10).map((r) => r.id);
    // Single batch delete instead of looping
    await db.delete(insightsTable).where(inArray(insightsTable.id, idsToDelete));
  }

  res.json(insights);
});

/** POST /api/insights/weekly-actions — generate this week's priorities */
router.post("/weekly-actions", async (req, res) => {
  const { user } = req;
  const { metrics, chartData } = await getMetricsForUser(user);
  const result = await generateWeeklyActions(metrics, chartData);
  res.json(result);
});

export default router;
