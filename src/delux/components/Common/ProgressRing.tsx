// @ts-nocheck -- imported from the original Delux app; strict-mode cleanup pending
import React, { useId } from "react";

interface ProgressRingProps {
  progress: number; // 0 to 100
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  showText?: boolean;
  /** Paint the arc with an ice-blue gradient instead of a flat stroke. */
  gradient?: boolean;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  progress,
  size = 72,
  strokeWidth = 7,
  color = "var(--color-delux-action)",
  backgroundColor = "var(--color-delux-border)",
  showText = true,
  gradient = false,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedProgress = Math.min(Math.max(progress, 0), 100);
  const strokeDashoffset = circumference - (clampedProgress / 100) * circumference;
  const gradientId = `delux-ring${useId().replace(/:/g, "")}`;

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="rotate-[-90deg]">
        {gradient && (
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: color }} />
              <stop offset="100%" style={{ stopColor: "var(--accent-deep)" }} />
            </linearGradient>
          </defs>
        )}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={gradient ? `url(#${gradientId})` : color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
          className="transition-all duration-500 ease-out"
        />
      </svg>
      {showText && (
        <span className="absolute text-xs font-semibold tabular-nums text-delux-text">
          {clampedProgress}%
        </span>
      )}
    </div>
  );
};

export const ProgressBar: React.FC<{
  progress: number;
  className?: string;
  colorClass?: string;
}> = ({ progress, className = "h-2", colorClass = "bg-delux-action" }) => {
  const clamped = Math.min(Math.max(progress, 0), 100);
  return (
    <div
      className={`w-full bg-delux-elevated border border-delux-border/60 rounded-full overflow-hidden ${className}`}
    >
      <div
        className={`h-full ${colorClass} rounded-full transition-all duration-500 ease-out`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
};
