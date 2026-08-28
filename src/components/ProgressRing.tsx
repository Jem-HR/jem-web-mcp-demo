export interface ProgressRingProps {
  percentage: number;
  label: string;
  size?: number;
  strokeWidth?: number;
}

export function ProgressRing({
  label,
  percentage,
  size = 104,
  strokeWidth = 10,
}: ProgressRingProps) {
  const visualPercentage = Math.min(Math.max(percentage, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - visualPercentage / 100);

  return (
    <div className="progress-ring">
      <svg
        aria-label={label}
        height={size}
        role="img"
        viewBox={`0 0 ${size} ${size}`}
        width={size}
      >
        <title>{label}</title>
        <circle
          className="progress-ring__track"
          cx={size / 2}
          cy={size / 2}
          fill="none"
          r={radius}
          strokeWidth={strokeWidth}
        />
        <circle
          className="progress-ring__value"
          cx={size / 2}
          cy={size / 2}
          fill="none"
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeWidth={strokeWidth}
        />
        <text
          className="progress-ring__percentage"
          dominantBaseline="middle"
          textAnchor="middle"
          x={size / 2}
          y={size / 2}
        >
          {`${Math.round(visualPercentage)}%`}
        </text>
      </svg>
      <span className="progress-ring__label">{label}</span>
    </div>
  );
}
