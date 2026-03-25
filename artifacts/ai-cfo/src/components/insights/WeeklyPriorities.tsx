import { motion, AnimatePresence } from "framer-motion";
import { Target, Clock, CheckCircle2 } from "lucide-react";
import { ImpactBadge } from "./ImpactBadge";

interface WeeklyAction {
  priority: number;
  action: string;
  rationale: string;
  impact: string;
  outcome?: string;
}

interface WeeklyPrioritiesData {
  actions: WeeklyAction[];
  generatedAt: string;
}

interface WeeklyPrioritiesProps {
  visible: boolean;
  isPending: boolean;
  data: WeeklyPrioritiesData | undefined;
}

/** Collapsible panel showing this week's AI-generated priorities. */
export function WeeklyPriorities({ visible, isPending, data }: WeeklyPrioritiesProps) {
  return (
    <AnimatePresence>
      {visible && (isPending || data) && (
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
            {data && (
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Clock className="w-3 h-3" />
                Generated{" "}
                {new Date(data.generatedAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            )}
          </div>

          {isPending ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3].map((i) => (
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
              {data?.actions.map((action, i) => (
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
                        <h3 className="text-[14px] font-semibold text-foreground leading-snug">
                          {action.action}
                        </h3>
                        <ImpactBadge impact={action.impact || "Medium"} />
                      </div>
                      <p className="text-[12px] text-muted-foreground leading-relaxed mb-2">
                        {action.rationale}
                      </p>
                      {action.outcome && (
                        <div className="flex items-start gap-1.5 mt-2 bg-emerald-500/5 border border-emerald-500/10 rounded-lg px-3 py-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          <span className="text-[12px] text-emerald-500/90 leading-relaxed">
                            {action.outcome}
                          </span>
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
  );
}
