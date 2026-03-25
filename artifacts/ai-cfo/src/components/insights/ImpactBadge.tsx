import { Flame } from "lucide-react";

/** Displays a colour-coded impact level badge (High / Medium / Low). */

interface ImpactBadgeProps {
  impact: string;
}

export function ImpactBadge({ impact }: ImpactBadgeProps) {
  const colorClass =
    impact === "High"   ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
    : impact === "Medium" ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
    : "text-sky-400 bg-sky-500/10 border-sky-500/20";

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold uppercase tracking-wide ${colorClass}`}
    >
      {impact === "High" && <Flame className="w-2.5 h-2.5" />}
      {impact} impact
    </span>
  );
}
