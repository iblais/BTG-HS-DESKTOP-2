import React from 'react';

interface Button3DProps {
  children: React.ReactNode;
  variant?: 'primary' | 'orange' | 'green' | 'glass' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}

export const Button3D: React.FC<Button3DProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  className = '',
  disabled = false
}) => {
  const baseClasses = 'btn-3d rounded-xl font-medium text-center transition-all duration-200 ease-out cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  };

  const variantClasses = {
    primary: 'gradient-blue text-white',
    orange: 'gradient-orange text-white',
    green: 'gradient-green text-white',
    glass: 'glass-card text-white border border-white/10',
    secondary: 'bg-white/10 text-white border border-white/20 hover:bg-white/20'
  };

  return (
    <button
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};
