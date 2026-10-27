import React from 'react';

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
