/**
 * AI Insights routes — generate and retrieve AI-powered financial insights.
 * Orchestrates Stripe data collection and OpenAI calls.
 */

import { Router, type IRouter } from "express";
import { db, usersTable, insightsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import {
  fetchStripeMetrics,
  fetchStripeRevenueChart,
  generateDemoMetrics,
  generateDemoRevenueChart,
} from "../services/stripeService";
import { generateAIInsights, generateWeeklyActions } from "../services/insightsService";

const router: IRouter = Router();

router.use(requireAuth);

/** Helper — get metrics and chart data for the current user */
async function getMetricsForUser(user: any) {
  if (!user.demoMode && user.stripeConnected && user.stripeApiKey) {
    const [metrics, chartData] = await Promise.all([
      fetchStripeMetrics(user.stripeApiKey),
      fetchStripeRevenueChart(user.stripeApiKey),
    ]);
    return { metrics, chartData };
  } else {
    return {
      metrics: generateDemoMetrics(),
      chartData: generateDemoRevenueChart(),
    };
  }
}

/** GET /api/insights/latest — retrieve stored insights (most recent) */
router.get("/latest", async (req, res) => {
  const user = (req as any).user;

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
  const user = (req as any).user;

  const { metrics, chartData } = await getMetricsForUser(user);

  // Generate insights via OpenAI
  const insights = await generateAIInsights(metrics, chartData);

  // Persist to DB (keep last 10 per user — avoid unbounded growth)
  await db.insert(insightsTable).values({
    userId: user.id,
    insightsData: insights as any,
  });

  // Prune old insights — keep last 10
  const old = await db
    .select({ id: insightsTable.id })
    .from(insightsTable)
    .where(eq(insightsTable.userId, user.id))
    .orderBy(desc(insightsTable.generatedAt));

  if (old.length > 10) {
    const toDelete = old.slice(10).map((r) => r.id);
    for (const id of toDelete) {
      await db.delete(insightsTable).where(eq(insightsTable.id, id));
    }
  }

  res.json(insights);
});

/** POST /api/insights/weekly-actions — generate this week's priorities */
router.post("/weekly-actions", async (req, res) => {
  const user = (req as any).user;

  const { metrics, chartData } = await getMetricsForUser(user);
  const result = await generateWeeklyActions(metrics, chartData);

  res.json(result);
});

export default router;
