// @ts-nocheck -- imported from the original Delux app; strict-mode cleanup pending
import React from 'react';

interface ProgressRingProps {
  progress: number; // 0 to 100
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  showText?: boolean;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  progress,
  size = 72,
  strokeWidth = 7,
  color = '#8B5CF6',
  backgroundColor = '#292936',
  showText = true,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedProgress = Math.min(Math.max(progress, 0), 100);
  const strokeDashoffset = circumference - (clampedProgress / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="rotate-[-90deg]">
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
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
          className="transition-all duration-500 ease-out"
        />
      </svg>
      {showText && (
        <span className="absolute text-xs font-bold tabular-nums text-[#F5F5FA]">
          {clampedProgress}%
        </span>
      )}
    </div>
  );
};

export const ProgressBar: React.FC<{ progress: number; className?: string; colorClass?: string }> = ({
  progress,
  className = 'h-2',
  colorClass = 'bg-[#8B5CF6]',
}) => {
  const clamped = Math.min(Math.max(progress, 0), 100);
  return (
    <div className={`w-full bg-[#1A1A24] border border-[#292936]/60 rounded-full overflow-hidden ${className}`}>
      <div
        className={`h-full ${colorClass} rounded-full transition-all duration-500 ease-out`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
};
