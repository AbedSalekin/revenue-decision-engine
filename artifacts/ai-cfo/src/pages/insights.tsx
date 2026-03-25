import { useState } from "react";
import { useGetLatestInsights, useGenerateInsights, useGenerateWeeklyActions } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import {
  BrainCircuit, TrendingUp, AlertTriangle, Lightbulb,
  Target, Zap, Clock, CalendarDays, Loader2,
  ChevronRight, ArrowUpRight,
} from "lucide-react";
import { motion } from "framer-motion";
import { ConfidenceBadge }  from "@/components/insights/ConfidenceBadge";
import { ThinkingLoader }   from "@/components/insights/ThinkingLoader";
import { EmptyState }       from "@/components/insights/EmptyState";
import { WeeklyPriorities } from "@/components/insights/WeeklyPriorities";

export default function Insights() {
  const [weeklyVisible, setWeeklyVisible] = useState(false);

  const { data: insights, refetch } = useGetLatestInsights();
  const generateMutation      = useGenerateInsights({ mutation: { onSuccess: () => refetch() } });
  const weeklyActionsMutation = useGenerateWeeklyActions();

  const handleGenerateWeekly = () => {
    weeklyActionsMutation.mutate();
    setWeeklyVisible(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6 max-w-6xl mx-auto pb-16"
    >
      {/* Page header */}
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
            onClick={handleGenerateWeekly}
            disabled={weeklyActionsMutation.isPending}
            className="h-10 px-4 text-[13px] font-medium border-border hover:border-primary/40 transition-all"
          >
            {weeklyActionsMutation.isPending
              ? <><Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />Thinking…</>
              : <><Target className="w-3.5 h-3.5 mr-2" />This week's priorities</>}
          </Button>
          <Button
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
            className="h-10 px-4 text-[13px] font-medium bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white border-0 transition-all hover:scale-[1.01] active:scale-[0.98]"
          >
            {generateMutation.isPending
              ? <><Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />Analyzing…</>
              : <><Zap className="w-3.5 h-3.5 mr-2" />{insights ? "Regenerate" : "Generate Insights"}</>}
          </Button>
        </div>
      </div>

      {/* Weekly priorities panel */}
      <WeeklyPriorities
        visible={weeklyVisible}
        isPending={weeklyActionsMutation.isPending}
        data={weeklyActionsMutation.data}
      />

      {/* AI thinking animation */}
      {generateMutation.isPending && <ThinkingLoader />}

      {/* Empty state */}
      {!insights && !generateMutation.isPending && (
        <EmptyState onGenerate={() => generateMutation.mutate()} />
      )}

      {/* Insights report */}
      {insights && !generateMutation.isPending && (
        <>
          <div className="flex items-center text-[11px] text-muted-foreground">
            <Clock className="w-3 h-3 mr-1.5" />
            Last generated: {new Date(insights.generatedAt).toLocaleString()}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Revenue Forecast */}
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="bg-card rounded-xl p-6 border border-border shadow-sm flex flex-col"
            >
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-[14px] font-semibold text-foreground">Revenue Forecast</h2>
                  <p className="text-[12px] text-muted-foreground mt-0.5 leading-relaxed">
                    {insights.forecast.summary}
                  </p>
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
                      <span className="text-[14px] font-semibold text-primary">
                        {formatCurrency(m.projectedRevenue)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Identified Risks */}
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
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

            {/* Growth Opportunities */}
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
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
                  <p className="text-[12px] text-muted-foreground leading-relaxed">
                    {insights.opportunities.summary}
                  </p>
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
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.4 }}
              className="bg-card rounded-xl p-6 border border-border shadow-sm flex flex-col"
            >
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-violet-500/10 text-violet-400 flex items-center justify-center shrink-0">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-[14px] font-semibold text-foreground">Recommended Actions</h2>
                  <p className="text-[12px] text-muted-foreground mt-0.5 leading-relaxed">
                    {insights.recommendedActions.summary}
                  </p>
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
