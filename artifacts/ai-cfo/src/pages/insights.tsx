import { useState } from "react";
import { 
  useGetLatestInsights, 
  useGenerateInsights, 
  useGenerateWeeklyActions 
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { 
  BrainCircuit, TrendingUp, AlertTriangle, Lightbulb, 
  Target, Zap, Clock, CalendarDays, Loader2,
  ChevronRight, CheckCircle2, ArrowUpRight, Flame
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ── Confidence badge ────────────────────────────────────────────────────────

function ConfidenceBadge({ score, label }: { score?: number; label?: string }) {
  const display = label || (score !== undefined ? (score >= 75 ? "High" : score >= 50 ? "Medium" : "Low") : "—");
  const s = score ?? (display === "High" ? 82 : display === "Medium" ? 65 : 45);
  const color = s >= 75 ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
    : s >= 50 ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
    : "text-rose-400 bg-rose-500/10 border-rose-500/20";
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold uppercase tracking-wide ${color}`}>
      {s}% confidence
    </span>
  );
}

// ── Impact badge ────────────────────────────────────────────────────────────

function ImpactBadge({ impact }: { impact: string }) {
  const color = impact === "High"
    ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
    : impact === "Medium"
    ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
    : "text-sky-400 bg-sky-500/10 border-sky-500/20";
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold uppercase tracking-wide ${color}`}>
      {impact === "High" && <Flame className="w-2.5 h-2.5" />}
      {impact} impact
    </span>
  );
}

// ── Skeleton loaders ────────────────────────────────────────────────────────

function SkeletonInsightCard() {
  return (
    <div className="bg-card rounded-xl p-6 border border-border animate-pulse flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-secondary rounded-lg" />
        <div className="flex-1">
          <div className="h-4 w-32 bg-secondary rounded mb-2" />
          <div className="h-3 w-20 bg-secondary rounded" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 w-full bg-secondary rounded" />
        <div className="h-3 w-5/6 bg-secondary rounded" />
        <div className="h-3 w-4/6 bg-secondary rounded" />
      </div>
      <div className="space-y-2 mt-2">
        <div className="h-3 w-full bg-secondary/60 rounded" />
        <div className="h-3 w-5/6 bg-secondary/60 rounded" />
        <div className="h-3 w-3/4 bg-secondary/60 rounded" />
      </div>
    </div>
  );
}

// ── AI "thinking" animation ─────────────────────────────────────────────────

function ThinkingLoader() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {[
        { label: "Revenue Forecast", color: "bg-primary/10" },
        { label: "Risk Analysis", color: "bg-rose-500/10" },
        { label: "Growth Opportunities", color: "bg-emerald-500/10" },
        { label: "Recommended Actions", color: "bg-violet-500/10" },
      ].map((c, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1, duration: 0.3 }}
          className="bg-card rounded-xl p-6 border border-border"
        >
          <div className={`w-10 h-10 rounded-lg ${c.color} mb-4 animate-pulse`} />
          <div className="text-[12px] text-muted-foreground font-medium mb-3">{c.label}</div>
          <div className="space-y-2">
            {[1, 0.9, 0.7].map((op, j) => (
              <motion.div
                key={j}
                className="h-3 bg-secondary rounded"
                style={{ width: `${op * 100}%` }}
                animate={{ opacity: [0.4, 0.8, 0.4] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: j * 0.2 }}
              />
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────

export default function Insights() {
  const [weeklyExpanded, setWeeklyExpanded] = useState(false);
  const { data: insights, refetch } = useGetLatestInsights();
  
  const generateMutation = useGenerateInsights({
    mutation: { onSuccess: () => refetch() }
  });

  const weeklyActionsMutation = useGenerateWeeklyActions();

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6 max-w-6xl mx-auto pb-16"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-[22px] font-semibold text-foreground flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <BrainCircuit className="w-4.5 h-4.5" />
            </div>
            Financial Intelligence
          </h1>
          <p className="text-[13px] text-muted-foreground mt-1">
            AI-driven analysis to help you grow faster and mitigate risks.
          </p>
        </div>
        <div className="flex gap-2.5">
          <Button
            variant="outline"
            onClick={() => { weeklyActionsMutation.mutate(); setWeeklyExpanded(true); }}
            disabled={weeklyActionsMutation.isPending}
            className="h-10 px-4 text-[13px] font-medium border-border hover:border-primary/40 transition-all"
          >
            {weeklyActionsMutation.isPending
              ? <><Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />Thinking…</>
              : <><Target className="w-3.5 h-3.5 mr-2" />This week's priorities</>
            }
          </Button>
          <Button
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
            className="h-10 px-4 text-[13px] font-medium bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white border-0 transition-all hover:scale-[1.01] active:scale-[0.98]"
          >
            {generateMutation.isPending
              ? <><Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />Analyzing…</>
              : <><Zap className="w-3.5 h-3.5 mr-2" />{insights ? "Regenerate" : "Generate Insights"}</>
            }
          </Button>
        </div>
      </div>

      {/* Weekly priorities */}
      <AnimatePresence>
        {weeklyExpanded && (weeklyActionsMutation.data || weeklyActionsMutation.isPending) && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="bg-card border border-border rounded-xl overflow-hidden shadow-sm"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Target className="w-3.5 h-3.5" />
                </div>
                <h2 className="text-[15px] font-semibold text-foreground">Your Weekly Priorities</h2>
              </div>
              {weeklyActionsMutation.data && (
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  Generated {new Date(weeklyActionsMutation.data.generatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              )}
            </div>

            {weeklyActionsMutation.isPending ? (
              <div className="p-6 space-y-4">
                {[1,2,3].map(i => (
                  <div key={i} className="flex items-start gap-4 animate-pulse">
                    <div className="w-8 h-8 bg-secondary rounded-lg shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-2/3 bg-secondary rounded" />
                      <div className="h-3 w-full bg-secondary rounded" />
                      <div className="h-3 w-4/5 bg-secondary/60 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {weeklyActionsMutation.data?.actions.map((action, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="px-6 py-5 hover:bg-secondary/20 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 text-[13px] font-bold">
                        {action.priority}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 mb-1.5">
                          <h3 className="text-[14px] font-semibold text-foreground leading-snug">{action.action}</h3>
                          <ImpactBadge impact={action.impact || "Medium"} />
                        </div>
                        <p className="text-[12px] text-muted-foreground leading-relaxed mb-2">{action.rationale}</p>
                        {action.outcome && (
                          <div className="flex items-start gap-1.5 mt-2 bg-emerald-500/5 border border-emerald-500/10 rounded-lg px-3 py-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                            <span className="text-[12px] text-emerald-500/90 leading-relaxed">{action.outcome}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading state */}
      {generateMutation.isPending && <ThinkingLoader />}

      {/* Empty state */}
      {!insights && !generateMutation.isPending && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-24 bg-card rounded-xl border border-border shadow-sm"
        >
          <div className="w-16 h-16 rounded-2xl bg-primary/5 flex items-center justify-center mx-auto mb-5">
            <BrainCircuit className="w-8 h-8 text-muted-foreground/30" />
          </div>
          <h3 className="text-[16px] font-semibold text-foreground mb-2">No insights yet</h3>
          <p className="text-[13px] text-muted-foreground max-w-sm mx-auto mb-6">
            Click <strong>Generate Insights</strong> to analyze your financial data and get a comprehensive AI-powered report.
          </p>
          <Button
            onClick={() => generateMutation.mutate()}
            className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-0"
          >
            <Zap className="w-4 h-4 mr-2" />
            Generate my first report
          </Button>
        </motion.div>
      )}

      {/* Insights content */}
      {insights && !generateMutation.isPending && (
        <>
          <div className="flex items-center text-[11px] text-muted-foreground">
            <Clock className="w-3 h-3 mr-1.5" />
            Last generated: {new Date(insights.generatedAt).toLocaleString()}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Forecast */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="bg-card rounded-xl p-6 border border-border shadow-sm flex flex-col"
            >
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-[14px] font-semibold text-foreground">Revenue Forecast</h2>
                  <p className="text-[12px] text-muted-foreground mt-0.5 leading-relaxed">{insights.forecast.summary}</p>
                </div>
              </div>

              <div className="space-y-0 mt-auto border-t border-border/50 pt-3">
                {insights.forecast.months.map((m, i) => (
                  <div key={i} className="flex items-center justify-between py-2.5 border-b border-border/30 last:border-0">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-[13px] font-medium text-foreground">{m.month}</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <ConfidenceBadge score={m.confidenceScore} label={m.confidence} />
                      <span className="text-[14px] font-semibold text-primary">{formatCurrency(m.projectedRevenue)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Risks */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.4 }}
              className="bg-card rounded-xl p-6 border border-border shadow-sm flex flex-col"
            >
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h2 className="text-[14px] font-semibold text-foreground">Identified Risks</h2>
                    {insights.risks.confidenceScore && (
                      <ConfidenceBadge score={insights.risks.confidenceScore} />
                    )}
                  </div>
                  <p className="text-[12px] text-muted-foreground leading-relaxed">{insights.risks.summary}</p>
                </div>
              </div>

              <ul className="space-y-3 mt-auto border-t border-border/50 pt-4">
                {insights.risks.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-rose-500/10 flex items-center justify-center shrink-0 mt-0.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    </div>
                    <span className="text-[13px] text-foreground leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Opportunities */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="bg-card rounded-xl p-6 border border-border shadow-sm flex flex-col"
            >
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                  <Lightbulb className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h2 className="text-[14px] font-semibold text-foreground">Growth Opportunities</h2>
                    {insights.opportunities.confidenceScore && (
                      <ConfidenceBadge score={insights.opportunities.confidenceScore} />
                    )}
                  </div>
                  <p className="text-[12px] text-muted-foreground leading-relaxed">{insights.opportunities.summary}</p>
                </div>
              </div>

              <ul className="space-y-3 mt-auto border-t border-border/50 pt-4">
                {insights.opportunities.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5">
                      <ArrowUpRight className="w-3 h-3 text-emerald-500" />
                    </div>
                    <span className="text-[13px] text-foreground leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Recommended Actions */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.4 }}
              className="bg-card rounded-xl p-6 border border-border shadow-sm flex flex-col"
            >
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-violet-500/10 text-violet-400 flex items-center justify-center shrink-0">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-[14px] font-semibold text-foreground">Recommended Actions</h2>
                  <p className="text-[12px] text-muted-foreground mt-0.5 leading-relaxed">{insights.recommendedActions.summary}</p>
                </div>
              </div>

              <ul className="space-y-3 mt-auto border-t border-border/50 pt-4">
                {insights.recommendedActions.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-violet-500/10 flex items-center justify-center shrink-0 mt-0.5">
                      <ChevronRight className="w-3 h-3 text-violet-400" />
                    </div>
                    <span className="text-[13px] text-foreground leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </>
      )}
    </motion.div>
  );
}
