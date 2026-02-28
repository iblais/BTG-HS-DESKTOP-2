import React from 'react';

interface ProgressBarProps {
  progress: number;
  color?: 'blue' | 'orange' | 'pink' | 'green';
  className?: string;
  animated?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  color = 'blue',
  className = '',
  animated = true
}) => {
  const colorClasses = {
    blue: 'bg-[#10B981]',
    orange: 'bg-[#FF6B35]',
    pink: 'bg-[#FF69B4]',
    green: 'bg-[#50D890]'
  };

  const glowColors = {
    blue: 'rgba(16, 185, 129, 0.3)',
    orange: 'rgba(255, 107, 53, 0.3)',
    pink: 'rgba(255, 105, 180, 0.3)',
    green: 'rgba(80, 216, 144, 0.3)'
  };

  return (
    <div
      className={`w-full h-2.5 rounded-full overflow-hidden ${animated ? 'progress-bar' : ''} ${className}`}
      style={{
        background: 'rgba(255, 255, 255, 0.06)',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.4) inset, 0 1px 2px rgba(0, 0, 0, 0.3) inset, 0 -1px 0 rgba(255, 255, 255, 0.04)',
      }}
    >
      <div
        className={`h-full ${colorClasses[color]} rounded-full transition-all duration-500 ease-out`}
        style={{
          width: `${Math.min(Math.max(progress, 0), 100)}%`,
          boxShadow: `0 1px 0 rgba(255, 255, 255, 0.2) inset, 0 -1px 0 rgba(0, 0, 0, 0.15) inset, 0 0 8px ${glowColors[color]}`,
        }}
      />
    </div>
  );
};
