/** Displays a colour-coded confidence percentage badge. */

interface ConfidenceBadgeProps {
  score?: number;
  label?: string;
}

export function ConfidenceBadge({ score, label }: ConfidenceBadgeProps) {
  const display = label || (score !== undefined
    ? (score >= 75 ? "High" : score >= 50 ? "Medium" : "Low")
    : "—");

  const s = score ?? (display === "High" ? 82 : display === "Medium" ? 65 : 45);

  const colorClass =
    s >= 75 ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
    : s >= 50 ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
    : "text-rose-400 bg-rose-500/10 border-rose-500/20";

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold uppercase tracking-wide ${colorClass}`}
    >
      {s}% confidence
    </span>
  );
}
