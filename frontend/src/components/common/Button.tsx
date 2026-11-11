import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  isLoading = false,
  className = '',
  children,
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-bold tracking-tight transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]';

  const sizeStyles = {
    sm: 'h-8 px-3 text-xs gap-1.5 rounded-lg font-semibold',
    md: 'h-9 px-4 text-xs gap-2 rounded-xl font-bold',
    lg: 'h-11 px-5 text-sm gap-2.5 rounded-xl font-bold',
  }[size];

  const variantStyles = {
    primary:
      'bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white shadow-sm hover:shadow-card focus-visible:ring-brand-500 ring-1 ring-white/10',
    secondary:
      'bg-graphite-900 hover:bg-graphite-800 active:bg-graphite-950 text-white shadow-sm hover:shadow-card focus-visible:ring-graphite-800',
    outline:
      'bg-white hover:bg-ivory-100 active:bg-ivory-200 text-graphite-800 border border-[#EAE8E3] shadow-subtle hover:border-[#DDD5C2] focus-visible:ring-ivory-400',
    ghost:
      'bg-transparent hover:bg-ivory-200/70 active:bg-ivory-300/80 text-graphite-600 hover:text-graphite-900 focus-visible:ring-ivory-400',
    destructive:
      'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-sm focus-visible:ring-rose-500',
    accent:
      'bg-lavender-600 hover:bg-lavender-700 active:bg-lavender-800 text-white shadow-sm hover:shadow-card focus-visible:ring-lavender-500',
  }[variant];

  return (
    <button
      className={`${baseStyles} ${sizeStyles} ${variantStyles} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin flex-shrink-0" />
      ) : icon ? (
        <span className="flex-shrink-0 [&>svg]:w-3.5 [&>svg]:h-3.5 sm:[&>svg]:w-4 sm:[&>svg]:h-4">{icon}</span>
      ) : null}
      {children}
      {iconRight && !isLoading && (
        <span className="flex-shrink-0 [&>svg]:w-3.5 [&>svg]:h-3.5 sm:[&>svg]:w-4 sm:[&>svg]:h-4">{iconRight}</span>
      )}
    </button>
  );
};