/**
 * AI Insights service — calls OpenAI to generate structured financial analysis.
 * Returns typed JSON for forecasts, risks, opportunities, actions, and weekly priorities.
 */

import OpenAI from "openai";
import type { FinancialMetrics, RevenueDataPoint } from "../stripe/types";
import { buildFinancialContext } from "./context";

const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey:  process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
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

/** Strip markdown fences from a JSON string returned by the model. */
function extractJson(raw: string): string {
  return raw.replace(/```(?:json)?/g, "").trim();
}

export async function generateAIInsights(
  metrics: FinancialMetrics,
  chartData: RevenueDataPoint[],
): Promise<InsightsData> {
  const context = buildFinancialContext(metrics, chartData);

  const systemPrompt = `You are an elite CFO advisor for early-stage startups with deep expertise in SaaS unit economics, marketplace dynamics, and subscription businesses. You analyze financial data and generate precise, actionable intelligence.

Rules:
- Be extremely specific — reference exact numbers from the data
- Provide investor-grade analysis
- Focus on the 3-6 month horizon
- Every risk and opportunity must be tied to a specific metric
- Return ONLY valid JSON, no markdown or prose outside the JSON`;

  const userPrompt = `Analyze this financial data and return a JSON insights report:

${JSON.stringify(context, null, 2)}

Return ONLY this JSON structure:
{
  "forecast": {
    "summary": "2-3 sentence forecast narrative citing exact MRR figures and growth trajectory",
    "months": [
      { "month": "Apr 2026", "projectedRevenue": 28500, "confidence": "High",   "confidenceScore": 85 },
      { "month": "May 2026", "projectedRevenue": 31000, "confidence": "Medium", "confidenceScore": 70 },
      { "month": "Jun 2026", "projectedRevenue": 34500, "confidence": "Low",    "confidenceScore": 55 }
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
      "Action 1: specific, measurable",
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
      { role: "user",   content: userPrompt },
    ],
  });

  const raw = response.choices[0]?.message?.content || "{}";

  let parsed: Omit<InsightsData, "generatedAt">;
  try {
    parsed = JSON.parse(extractJson(raw));
  } catch {
    throw new Error("Failed to parse AI insights response as JSON");
  }

  return { ...parsed, generatedAt: new Date().toISOString() };
}

export async function generateWeeklyActions(
  metrics: FinancialMetrics,
  chartData: RevenueDataPoint[],
): Promise<{ actions: WeeklyAction[]; generatedAt: string }> {
  const context = buildFinancialContext(metrics, chartData);

  const prompt = `Based on this financial data, return the 3 highest-impact actions for this week:

${JSON.stringify(context, null, 2)}

Each action must be completable in 5 business days. Return ONLY this JSON:
{
  "actions": [
    {
      "priority": 1,
      "action": "Specific, concrete action",
      "rationale": "Why now, backed by the data",
      "impact": "High",
      "outcome": "Expected result if completed"
    },
    { "priority": 2, "action": "...", "rationale": "...", "impact": "Medium", "outcome": "..." },
    { "priority": 3, "action": "...", "rationale": "...", "impact": "Medium", "outcome": "..." }
  ]
}`;

  const response = await openai.chat.completions.create({
    model: "gpt-5.2",
    max_completion_tokens: 4096,
    messages: [
      {
        role: "system",
        content: "You are a pragmatic startup CFO. Give founders specific, high-impact weekly actions with clear outcomes. Reference exact numbers. Return only valid JSON.",
      },
      { role: "user", content: prompt },
    ],
  });

  const raw = response.choices[0]?.message?.content || "{}";

  let parsed: { actions: WeeklyAction[] };
  try {
    parsed = JSON.parse(extractJson(raw));
  } catch {
    throw new Error("Failed to parse weekly actions response as JSON");
  }

  return { actions: parsed.actions, generatedAt: new Date().toISOString() };
}
