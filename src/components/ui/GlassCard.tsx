import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
  glow?: 'none' | 'green' | 'gold' | 'coral';
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  hover = true,
  onClick,
  glow = 'none'
}) => {
  const glowClass = glow === 'green' ? 'glow-card' : glow === 'gold' ? 'glow-card-gold' : glow === 'coral' ? 'glow-card-coral' : 'glass-card';

  return (
    <div
      className={`${glowClass} rounded-2xl p-4 transition-all duration-300 ${hover ? '' : 'hover:transform-none hover:shadow-none'} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};
