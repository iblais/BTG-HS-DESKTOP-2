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
    blue: 'bg-[#4A5FFF]',
    orange: 'bg-[#FF6B35]',
    pink: 'bg-[#FF69B4]',
    green: 'bg-[#50D890]'
  };

  return (
    <div className={`w-full h-2 bg-white/10 rounded-full overflow-hidden ${animated ? 'progress-bar' : ''} ${className}`}>
      <div
        className={`h-full ${colorClasses[color]} rounded-full transition-all duration-500 ease-out`}
        style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
      />
    </div>
  );
};
