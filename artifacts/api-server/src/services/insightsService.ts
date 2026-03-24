/**
 * AI Insights service — aggregates financial metrics and sends them to OpenAI
 * to generate structured, actionable insights for the founder.
 */

import OpenAI from "openai";
import type { FinancialMetrics, RevenueDataPoint } from "./stripeService";

const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
});

export interface ForecastMonth {
  month: string;
  projectedRevenue: number;
  confidence: string;
  confidenceScore?: number;
}

export interface InsightsData {
  forecast: {
    summary: string;
    months: ForecastMonth[];
  };
  risks: {
    summary: string;
    items: string[];
    confidenceScore?: number;
  };
  opportunities: {
    summary: string;
    items: string[];
    confidenceScore?: number;
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
  impact: string;
  outcome: string;
}

/**
 * Build a structured financial context object to send to the AI.
 * Rich, structured JSON gives the model more to work with.
 */
function buildFinancialContext(
  metrics: FinancialMetrics,
  chartData: RevenueDataPoint[],
): object {
  const mrrGrowthRate =
    metrics.prevMonthMrr > 0
      ? (((metrics.mrr - metrics.prevMonthMrr) / metrics.prevMonthMrr) * 100).toFixed(1)
      : "N/A";

  const revenueGrowthRate =
    metrics.prevMonthRevenue > 0
      ? (((metrics.totalRevenue - metrics.prevMonthRevenue) / metrics.prevMonthRevenue) * 100).toFixed(1)
      : "N/A";

  const customerGrowthRate =
    metrics.prevMonthCustomers > 0
      ? (((metrics.activeCustomers - metrics.prevMonthCustomers) / metrics.prevMonthCustomers) * 100).toFixed(1)
      : "N/A";

  const last6Months = chartData.slice(-6).map((d) => ({
    month: d.month,
    mrr: d.mrr,
    revenue: d.revenue,
    customers: d.customers,
  }));

  const mrrTrend = chartData.slice(-3);
  const avgGrowth = mrrTrend.length >= 2
    ? (((mrrTrend[mrrTrend.length - 1].mrr - mrrTrend[0].mrr) / mrrTrend[0].mrr) * 100).toFixed(1)
    : "N/A";

  return {
    asOf: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
    companyType: metrics.companyType || "saas",
    currentMetrics: {
      mrr: metrics.mrr,
      mrrGrowthMoM: `${mrrGrowthRate}%`,
      totalRevenueMTD: metrics.totalRevenue,
      revenueGrowthMoM: `${revenueGrowthRate}%`,
      activeCustomers: metrics.activeCustomers,
      customerGrowthMoM: `${customerGrowthRate}%`,
      activeSubscriptions: metrics.activeSubscriptions,
      churnRate: `${metrics.churnRate.toFixed(1)}%`,
      arpu: metrics.avgRevenuePerUser,
      overdueInvoices: metrics.overdueInvoices,
      totalInvoices: metrics.totalInvoices,
    },
    recentTrend: {
      last6Months,
      avgMoMGrowthLast3Months: `${avgGrowth}%`,
    },
  };
}

/**
 * Call OpenAI to generate a full financial insights report.
 * Returns structured JSON with forecast, risks, opportunities, and actions.
 */
export async function generateAIInsights(
  metrics: FinancialMetrics,
  chartData: RevenueDataPoint[],
): Promise<InsightsData> {
  const financialContext = buildFinancialContext(metrics, chartData);

  const systemPrompt = `You are an elite CFO advisor for early-stage startups with deep expertise in SaaS unit economics, marketplace dynamics, and subscription businesses. You analyze financial data and generate precise, actionable intelligence.

Rules:
- Be extremely specific — reference exact numbers from the data
- Provide investor-grade analysis
- Focus on the 3-6 month horizon
- Every risk and opportunity must be tied to a specific metric
- Return ONLY valid JSON, no markdown or prose outside the JSON`;

  const userPrompt = `Analyze this financial data and return a JSON insights report:

${JSON.stringify(financialContext, null, 2)}

Return ONLY this JSON structure:
{
  "forecast": {
    "summary": "2-3 sentence forecast narrative citing exact MRR figures and growth trajectory",
    "months": [
      { "month": "Apr 2026", "projectedRevenue": 28500, "confidence": "High", "confidenceScore": 85 },
      { "month": "May 2026", "projectedRevenue": 31000, "confidence": "Medium", "confidenceScore": 70 },
      { "month": "Jun 2026", "projectedRevenue": 34500, "confidence": "Low", "confidenceScore": 55 }
    ]
  },
  "risks": {
    "summary": "Overall risk posture in 1-2 sentences",
    "confidenceScore": 78,
    "items": [
      "Risk 1: specific, data-backed (e.g. 'Churn rate of X% implies losing $Y MRR per month')",
      "Risk 2",
      "Risk 3"
    ]
  },
  "opportunities": {
    "summary": "1-2 sentence growth opportunity overview",
    "confidenceScore": 82,
    "items": [
      "Opportunity 1 with projected revenue impact (e.g. 'Reducing churn by 1% adds $X MRR')",
      "Opportunity 2",
      "Opportunity 3"
    ]
  },
  "recommendedActions": {
    "summary": "1-2 sentence action plan overview",
    "items": [
      "Action 1: specific, measurable (e.g. 'Launch win-back campaign targeting 23 churned accounts from Q1')",
      "Action 2",
      "Action 3"
    ]
  }
}`;

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
 * Generate 3 prioritized weekly actions with impact level and expected outcome.
 */
export async function generateWeeklyActions(
  metrics: FinancialMetrics,
  chartData: RevenueDataPoint[],
): Promise<{ actions: WeeklyAction[]; generatedAt: string }> {
  const financialContext = buildFinancialContext(metrics, chartData);

  const prompt = `Based on this financial data, return the 3 highest-impact actions for this week:

${JSON.stringify(financialContext, null, 2)}

Each action must be completable in 5 business days. Return ONLY this JSON:
{
  "actions": [
    {
      "priority": 1,
      "action": "Specific, concrete action (e.g. 'Call the 7 accounts that haven't paid in 30+ days')",
      "rationale": "Why now, backed by the data (e.g. 'You have $X overdue — collecting 50% adds $Y this month')",
      "impact": "High",
      "outcome": "Expected result if completed (e.g. 'Recover $2,400 in overdue revenue and reduce churn risk')"
    },
    {
      "priority": 2,
      "action": "...",
      "rationale": "...",
      "impact": "Medium",
      "outcome": "..."
    },
    {
      "priority": 3,
      "action": "...",
      "rationale": "...",
      "impact": "Medium",
      "outcome": "..."
    }
  ]
}`;

  const response = await openai.chat.completions.create({
    model: "gpt-5.2",
    max_completion_tokens: 4096,
    messages: [
      {
        role: "system",
        content:
          "You are a pragmatic startup CFO. Give founders specific, high-impact weekly actions with clear outcomes. Reference exact numbers. Return only valid JSON.",
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
