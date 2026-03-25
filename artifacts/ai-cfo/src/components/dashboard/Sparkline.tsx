/** Tiny inline SVG sparkline for metric cards. */

interface SparklineProps {
  data: number[];
  positive?: boolean;
}

export function Sparkline({ data, positive = true }: SparklineProps) {
  if (!data || data.length < 2) return null;

  const w = 72;
  const h = 28;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const pts = data
    .map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`)
    .join(" ");

  const color = positive ? "#10b981" : "#f43f5e";

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible opacity-80">
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
