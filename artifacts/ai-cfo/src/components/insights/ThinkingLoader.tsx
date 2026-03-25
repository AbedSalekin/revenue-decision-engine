import { motion } from "framer-motion";

const SECTIONS = [
  { label: "Revenue Forecast",      colorClass: "bg-primary/10" },
  { label: "Risk Analysis",         colorClass: "bg-rose-500/10" },
  { label: "Growth Opportunities",  colorClass: "bg-emerald-500/10" },
  { label: "Recommended Actions",   colorClass: "bg-violet-500/10" },
];

/** Animated skeleton shown while AI is generating insights. */
export function ThinkingLoader() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {SECTIONS.map((section, i) => (
        <motion.div
          key={section.label}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1, duration: 0.3 }}
          className="bg-card rounded-xl p-6 border border-border"
        >
          <div className={`w-10 h-10 rounded-lg ${section.colorClass} mb-4 animate-pulse`} />
          <div className="text-[12px] text-muted-foreground font-medium mb-3">{section.label}</div>
          <div className="space-y-2">
            {[1, 0.9, 0.7].map((opacity, j) => (
              <motion.div
                key={j}
                className="h-3 bg-secondary rounded"
                style={{ width: `${opacity * 100}%` }}
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
