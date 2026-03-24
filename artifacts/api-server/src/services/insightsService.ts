/**
 * AI Insights service — aggregates financial metrics and sends them to OpenAI
 * to generate structured, actionable insights for the founder.
 */

import OpenAI from "openai";
import type { FinancialMetrics, RevenueDataPoint } from "./stripeService";

// Initialize the OpenAI client using Replit AI Integrations proxy
const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
});

export interface ForecastMonth {
  month: string;
  projectedRevenue: number;
  confidence: string;
}

export interface InsightsData {
  forecast: {
    summary: string;
    months: ForecastMonth[];
  };
  risks: {
    summary: string;
    items: string[];
  };
  opportunities: {
    summary: string;
    items: string[];
  };
  recommendedActions: {
    summary: string;
    items: string[];
  };
  generatedAt: string;
}

export interface WeeklyAction {
  priority: number;
  action: string;
  rationale: string;
}

/**
 * Build a concise financial summary to send to the AI.
 * Keeps token count reasonable while providing sufficient context.
 */
function buildMetricsSummary(
  metrics: FinancialMetrics,
  chartData: RevenueDataPoint[],
): string {
  const mrrGrowth =
    metrics.prevMonthMrr > 0
      ? (((metrics.mrr - metrics.prevMonthMrr) / metrics.prevMonthMrr) * 100).toFixed(1)
      : "N/A";

  const last3Months = chartData.slice(-3);
  const recentTrend = last3Months
    .map((d) => `${d.month}: $${d.mrr.toLocaleString()} MRR`)
    .join(", ");

  return `
CURRENT METRICS (as of ${new Date().toLocaleDateString()}):
- MRR: $${metrics.mrr.toLocaleString()}
- MoM MRR Growth: ${mrrGrowth}%
- Total Revenue This Month: $${metrics.totalRevenue.toLocaleString()}
- Active Customers: ${metrics.activeCustomers}
- Active Subscriptions: ${metrics.activeSubscriptions}
- Monthly Churn Rate: ${metrics.churnRate.toFixed(1)}%
- ARPU: $${metrics.avgRevenuePerUser.toFixed(2)}
- Total Invoices (this month): ${metrics.totalInvoices}
- Overdue Invoices: ${metrics.overdueInvoices}

RECENT MRR TREND:
${recentTrend}
  `.trim();
}

/**
 * Call OpenAI to generate a full financial insights report.
 * Returns structured JSON with forecast, risks, opportunities, and actions.
 */
export async function generateAIInsights(
  metrics: FinancialMetrics,
  chartData: RevenueDataPoint[],
): Promise<InsightsData> {
  const metricsSummary = buildMetricsSummary(metrics, chartData);

  const systemPrompt = `You are an expert CFO advisor for early-stage SaaS startups. 
Analyze the provided financial metrics and generate a structured, actionable report.
Be specific, data-driven, and practical. Use exact dollar amounts and percentages where possible.
Format all monetary values as numbers (no $ symbols in values).`;

  const userPrompt = `${metricsSummary}

Generate a comprehensive financial analysis with the following structure as valid JSON:
{
  "forecast": {
    "summary": "2-3 sentence revenue forecast narrative",
    "months": [
      { "month": "Apr 2025", "projectedRevenue": 28500, "confidence": "High" },
      { "month": "May 2025", "projectedRevenue": 31000, "confidence": "Medium" },
      { "month": "Jun 2025", "projectedRevenue": 34500, "confidence": "Low" }
    ]
  },
  "risks": {
    "summary": "Overall risk assessment in 1-2 sentences",
    "items": [
      "Specific risk 1 with data-backed reasoning",
      "Specific risk 2",
      "Specific risk 3"
    ]
  },
  "opportunities": {
    "summary": "Growth opportunity overview in 1-2 sentences",
    "items": [
      "Specific opportunity 1 with potential impact",
      "Specific opportunity 2",
      "Specific opportunity 3"
    ]
  },
  "recommendedActions": {
    "summary": "Action plan overview in 1-2 sentences",
    "items": [
      "Action 1: specific, measurable action",
      "Action 2: specific, measurable action",
      "Action 3: specific, measurable action"
    ]
  }
}

Return ONLY the JSON object, no markdown or other text.`;

  const response = await openai.chat.completions.create({
    model: "gpt-5.2",
    max_completion_tokens: 8192,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });

  const content = response.choices[0]?.message?.content || "{}";

  let parsed: Omit<InsightsData, "generatedAt">;
  try {
    // Strip any accidental markdown code fences
    const clean = content.replace(/```(?:json)?/g, "").trim();
    parsed = JSON.parse(clean);
  } catch {
    throw new Error("Failed to parse AI response as JSON");
  }

  return {
    ...parsed,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Generate 3 prioritized weekly actions based on current metrics.
 */
export async function generateWeeklyActions(
  metrics: FinancialMetrics,
  chartData: RevenueDataPoint[],
): Promise<{ actions: WeeklyAction[]; generatedAt: string }> {
  const metricsSummary = buildMetricsSummary(metrics, chartData);

  const prompt = `${metricsSummary}

Based on these metrics, what are the 3 most impactful actions the founder should take THIS WEEK?
Be very specific and actionable. Each action should be completable in 1 week.

Return ONLY a JSON object in this exact format:
{
  "actions": [
    { "priority": 1, "action": "Specific action to take", "rationale": "Why this will help (with data)" },
    { "priority": 2, "action": "Specific action to take", "rationale": "Why this will help (with data)" },
    { "priority": 3, "action": "Specific action to take", "rationale": "Why this will help (with data)" }
  ]
}`;

  const response = await openai.chat.completions.create({
    model: "gpt-5.2",
    max_completion_tokens: 4096,
    messages: [
      {
        role: "system",
        content:
          "You are a pragmatic startup CFO. Give founders specific, high-impact weekly actions. Be direct and data-driven.",
      },
      { role: "user", content: prompt },
    ],
  });

  const content = response.choices[0]?.message?.content || "{}";

  let parsed: { actions: WeeklyAction[] };
  try {
    const clean = content.replace(/```(?:json)?/g, "").trim();
    parsed = JSON.parse(clean);
  } catch {
    throw new Error("Failed to parse weekly actions response");
  }

  return {
    actions: parsed.actions,
    generatedAt: new Date().toISOString(),
  };
}
