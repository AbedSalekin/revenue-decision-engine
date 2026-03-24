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
  Target, Zap, Clock, CalendarDays 
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
    <div className="space-y-8 max-w-7xl mx-auto pb-24">
      {/* Header actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-6 rounded-2xl border border-border shadow-sm">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-3">
            <BrainCircuit className="w-8 h-8 text-primary" />
            Financial Intelligence
          </h1>
          <p className="text-muted-foreground mt-1">
            AI-driven analysis of your Stripe data to help you grow faster and mitigate risks.
          </p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={() => weeklyActionsMutation.mutate()}
            disabled={weeklyActionsMutation.isPending}
            className="border-primary/20 hover:bg-primary/10 hover:text-primary"
          >
            {weeklyActionsMutation.isPending ? "Analyzing..." : "What should I do this week?"}
          </Button>
          <Button 
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
            className="shadow-primary/30"
          >
            {generateMutation.isPending ? "Generating..." : "Regenerate Insights"}
            {!generateMutation.isPending && <Zap className="w-4 h-4 ml-2" />}
          </Button>
        </div>
      </div>

      {/* Weekly Actions Overlay / Section */}
      {weeklyActionsMutation.data && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="bg-gradient-to-r from-primary/10 to-transparent border border-primary/20 rounded-2xl p-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <Target className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-display font-bold text-foreground">Your Weekly Priorities</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {weeklyActionsMutation.data.actions.map((action, i) => (
              <div key={i} className="bg-card/50 backdrop-blur-md border border-border rounded-xl p-5 relative overflow-hidden group hover:border-primary/50 transition-colors">
                <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center shrink-0">
                    {action.priority}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2 leading-tight">{action.action}</h3>
                    <p className="text-sm text-muted-foreground">{action.rationale}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Insights Content */}
      {!insights && !generateMutation.isPending && (
        <div className="text-center py-24 bg-card rounded-2xl border border-border border-dashed">
          <BrainCircuit className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-foreground">No insights generated yet</h3>
          <p className="text-muted-foreground mt-2 max-w-md mx-auto mb-6">
            Click the button above to analyze your financial data and generate comprehensive insights.
          </p>
          <Button onClick={() => generateMutation.mutate()}>Generate Initial Insights</Button>
        </div>
      )}

      {generateMutation.isPending && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1,2,3,4].map(i => (
            <div key={i} className="bg-card rounded-2xl p-6 border border-border h-64 animate-pulse flex flex-col">
              <div className="w-12 h-12 bg-secondary rounded-xl mb-4" />
              <div className="h-6 w-1/3 bg-secondary rounded mb-4" />
              <div className="h-4 w-full bg-secondary rounded mb-2" />
              <div className="h-4 w-5/6 bg-secondary rounded mb-6" />
              <div className="space-y-2 mt-auto">
                <div className="h-3 w-full bg-secondary rounded" />
                <div className="h-3 w-4/5 bg-secondary rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {insights && !generateMutation.isPending && (
        <>
          <div className="flex items-center text-sm text-muted-foreground mb-4">
            <Clock className="w-4 h-4 mr-2" />
            Last generated: {new Date(insights.generatedAt).toLocaleString()}
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Forecast */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-2xl p-6 md:p-8 border border-border hover:border-emerald-500/30 transition-colors shadow-lg"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-6">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-display font-bold text-foreground mb-3">Revenue Forecast</h2>
              <p className="text-muted-foreground mb-8 leading-relaxed">{insights.forecast.summary}</p>
              
              <div className="space-y-3">
                {insights.forecast.months.map((m, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-secondary/50 rounded-xl border border-white/5">
                    <div className="flex items-center gap-3">
                      <CalendarDays className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium text-foreground">{m.month}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs px-2 py-1 rounded bg-background text-muted-foreground uppercase">
                        {m.confidence} conf.
                      </span>
                      <span className="font-bold text-emerald-400">{formatCurrency(m.projectedRevenue)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Risks */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card rounded-2xl p-6 md:p-8 border border-border hover:border-destructive/30 transition-colors shadow-lg"
            >
              <div className="w-12 h-12 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center mb-6">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-display font-bold text-foreground mb-3">Identified Risks</h2>
              <p className="text-muted-foreground mb-8 leading-relaxed">{insights.risks.summary}</p>
              
              <ul className="space-y-4">
                {insights.risks.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-destructive mt-2 shrink-0" />
                    <span className="text-foreground leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Opportunities */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-card rounded-2xl p-6 md:p-8 border border-border hover:border-blue-500/30 transition-colors shadow-lg"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center mb-6">
                <Lightbulb className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-display font-bold text-foreground mb-3">Growth Opportunities</h2>
              <p className="text-muted-foreground mb-8 leading-relaxed">{insights.opportunities.summary}</p>
              
              <ul className="space-y-4">
                {insights.opportunities.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0" />
                    <span className="text-foreground leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Recommended Actions */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-card rounded-2xl p-6 md:p-8 border border-border hover:border-primary/30 transition-colors shadow-lg"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-6">
                <Zap className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-display font-bold text-foreground mb-3">Recommended Actions</h2>
              <p className="text-muted-foreground mb-8 leading-relaxed">{insights.recommendedActions.summary}</p>
              
              <ul className="space-y-4">
                {insights.recommendedActions.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-3 bg-secondary/30 p-4 rounded-xl border border-white/5">
                    <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0 text-xs font-bold">
                      {i + 1}
                    </div>
                    <span className="text-foreground font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </>
      )}
    </div>
  );
}
