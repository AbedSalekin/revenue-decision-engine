import { BrainCircuit, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface EmptyStateProps {
  onGenerate: () => void;
}

/** Shown on the insights page when no report has been generated yet. */
export function EmptyState({ onGenerate }: EmptyStateProps) {
  return (
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
        onClick={onGenerate}
        className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-0"
      >
        <Zap className="w-4 h-4 mr-2" />
        Generate my first report
      </Button>
    </motion.div>
  );
}
