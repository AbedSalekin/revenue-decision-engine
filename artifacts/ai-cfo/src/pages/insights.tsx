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
  Target, Zap, Clock, CalendarDays, Loader2
} from "lucide-react";
import { motion } from "framer-motion";

export default function Insights() {
  const { data: insights, refetch } = useGetLatestInsights();
  
  const generateMutation = useGenerateInsights({
    mutation: {
      onSuccess: () => refetch(),
    }
  });

  const weeklyActionsMutation = useGenerateWeeklyActions();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-8 max-w-6xl mx-auto pb-24"
    >
      {/* Header actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-6 rounded-xl border border-border shadow-sm">
        <div>
          <h1 className="text-[16px] font-semibold text-foreground flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-primary" />
            Financial Intelligence
          </h1>
          <p className="text-[13px] text-muted-foreground mt-1">
            AI-driven analysis to help you grow faster and mitigate risks.
          </p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={() => weeklyActionsMutation.mutate()}
            disabled={weeklyActionsMutation.isPending}
            className="h-10 px-4 text-[13px] font-medium transition-all hover:scale-[1.01] active:scale-[0.98]"
          >
            {weeklyActionsMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {!weeklyActionsMutation.isPending && "What should I do this week?"}
          </Button>
          <Button 
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
            className="h-10 px-4 text-[13px] font-medium bg-primary hover:bg-primary/90 text-primary-foreground transition-all hover:scale-[1.01] active:scale-[0.98]"
          >
            {generateMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {!generateMutation.isPending && (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Generate Insights
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Weekly Actions Overlay / Section */}
      {weeklyActionsMutation.data && (
        <motion.div 
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-xl p-6 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-6">
            <Target className="w-5 h-5 text-primary" />
            <h2 className="text-[16px] font-semibold text-foreground">Your Weekly Priorities</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {weeklyActionsMutation.data.actions.map((action, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="text-3xl font-bold text-muted/50 leading-none tabular-nums tracking-tighter shrink-0 mt-1">
                  0{i + 1}
                </div>
                <div>
                  <h3 className="text-[14px] font-semibold text-foreground mb-1 leading-tight">{action.action}</h3>
                  <p className="text-[13px] text-muted-foreground leading-relaxed">{action.rationale}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Insights Content */}
      {!insights && !generateMutation.isPending && (
        <div className="text-center py-24 bg-card rounded-xl border border-border shadow-sm">
          <BrainCircuit className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-[16px] font-medium text-foreground">No insights generated yet</h3>
          <p className="text-[13px] text-muted-foreground mt-2 max-w-md mx-auto mb-6">
            Click the button above to analyze your financial data and generate comprehensive insights.
          </p>
        </div>
      )}

      {generateMutation.isPending && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1,2,3,4].map(i => (
            <div key={i} className="bg-card rounded-xl p-6 border border-border h-[280px] animate-pulse flex flex-col">
              <div className="w-10 h-10 bg-secondary rounded-lg mb-4" />
              <div className="h-5 w-1/3 bg-secondary rounded mb-4" />
              <div className="h-4 w-full bg-secondary rounded mb-2" />
              <div className="h-4 w-5/6 bg-secondary rounded mb-6" />
              <div className="space-y-3 mt-auto">
                <div className="h-3 w-full bg-secondary rounded" />
                <div className="h-3 w-4/5 bg-secondary rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {insights && !generateMutation.isPending && (
        <>
          <div className="flex items-center text-[12px] text-muted-foreground mb-2">
            <Clock className="w-3.5 h-3.5 mr-1.5" />
            Last generated: {new Date(insights.generatedAt).toLocaleString()}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Forecast */}
            <motion.div 
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="bg-card rounded-xl p-6 border border-border shadow-sm flex flex-col"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-5">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h2 className="text-[14px] font-medium text-foreground mb-2">Revenue Forecast</h2>
              <p className="text-[13px] text-muted-foreground mb-6 leading-relaxed flex-1">{insights.forecast.summary}</p>
              
              <div className="space-y-2 mt-auto">
                {insights.forecast.months.map((m, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-t border-border/50 first:border-0">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-[13px] font-medium text-foreground">{m.month}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-muted-foreground uppercase tracking-wide">
                        {m.confidence} conf
                      </span>
                      <span className="text-[13px] font-semibold text-primary">{formatCurrency(m.projectedRevenue)}</span>
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
              <div className="w-10 h-10 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center mb-5">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h2 className="text-[14px] font-medium text-foreground mb-2">Identified Risks</h2>
              <p className="text-[13px] text-muted-foreground mb-6 leading-relaxed">{insights.risks.summary}</p>
              
              <ul className="space-y-3 mt-auto">
                {insights.risks.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
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
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-5">
                <Lightbulb className="w-5 h-5" />
              </div>
              <h2 className="text-[14px] font-medium text-foreground mb-2">Growth Opportunities</h2>
              <p className="text-[13px] text-muted-foreground mb-6 leading-relaxed">{insights.opportunities.summary}</p>
              
              <ul className="space-y-3 mt-auto">
                {insights.opportunities.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
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
              <div className="w-10 h-10 rounded-lg bg-violet-500/10 text-violet-500 flex items-center justify-center mb-5">
                <Zap className="w-5 h-5" />
              </div>
              <h2 className="text-[14px] font-medium text-foreground mb-2">Recommended Actions</h2>
              <p className="text-[13px] text-muted-foreground mb-6 leading-relaxed">{insights.recommendedActions.summary}</p>
              
              <ul className="space-y-3 mt-auto">
                {insights.recommendedActions.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-violet-500 mt-1.5 shrink-0" />
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
