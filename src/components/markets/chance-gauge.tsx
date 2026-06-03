import { cn } from "@/lib/utils";

interface ChanceGaugeProps {
  value: number; // 0..1
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export function ChanceGauge({
  value,
  size = 56,
  strokeWidth = 6,
  className,
}: ChanceGaugeProps) {
  const pct = Math.max(0, Math.min(1, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = Math.PI * radius;
  const offset = circumference * (1 - pct);
  const display = Math.round(pct * 100);
  const stroke = pct >= 0.5 ? "oklch(0.65 0.2 145)" : "oklch(0.75 0.18 85)";
  const height = size / 2 + strokeWidth + 2;

  return (
    <div
      className={cn("relative leading-none", className)}
      style={{ width: size, height }}
      aria-label={`${display}% chance`}
    >
      <svg width={size} height={height} viewBox={`0 0 ${size} ${height}`} role="img">
        <path
          d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
          fill="none"
          stroke="currentColor"
          strokeOpacity={0.15}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        <path
          d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
          fill="none"
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.4s ease" }}
        />
      </svg>
      <div
        className="absolute inset-x-0 bottom-0 flex flex-col items-center"
        style={{ top: size / 2 - 4 }}
      >
        <div className="text-sm font-bold tabular-nums leading-tight">{display}%</div>
        <div className="text-[9px] uppercase text-muted-foreground tracking-wider leading-tight">
          chance
        </div>
      </div>
    </div>
  );
}
