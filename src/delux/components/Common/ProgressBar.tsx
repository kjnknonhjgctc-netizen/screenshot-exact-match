// @ts-nocheck -- imported from the original Delux app; strict-mode cleanup pending
import React from "react";

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
