import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  hover = true,
  onClick
}) => {
  return (
    <div
      className={`glass-card rounded-xl p-4 transition-all duration-300 ${hover ? 'hover:glass-card' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};
