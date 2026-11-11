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
    'inline-flex items-center justify-center font-medium tracking-tight transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]';

  const sizeStyles = {
    sm: 'h-8 px-3 text-xs gap-1.5 rounded-lg font-semibold',
    md: 'h-9 px-4 text-xs gap-2 rounded-lg font-semibold',
    lg: 'h-11 px-5 text-sm gap-2.5 rounded-xl font-semibold',
  }[size];

  const variantStyles = {
    primary:
      'bg-forest-800 hover:bg-forest-900 active:bg-forest-950 text-cream-50 shadow-parchment border border-forest-700/60 focus-visible:ring-forest-700 hover:shadow-forest-glow',
    secondary:
      'bg-espresso-900 hover:bg-espresso-850 active:bg-espresso-950 text-cream-50 shadow-parchment border border-espresso-800 focus-visible:ring-espresso-800',
    outline:
      'bg-[#FDFBF7] hover:bg-parchment-100 active:bg-parchment-200 text-espresso-900 border border-[#DDD2BF] shadow-parchment-sm hover:border-brass-600 focus-visible:ring-brass-500',
    ghost:
      'bg-transparent hover:bg-parchment-200/70 active:bg-parchment-300 text-espresso-700 hover:text-espresso-900 focus-visible:ring-brass-400',
    destructive:
      'bg-oxblood-800 hover:bg-oxblood-900 active:bg-oxblood-950 text-cream-50 shadow-parchment border border-oxblood-700 focus-visible:ring-oxblood-600',
    accent:
      'bg-brass-600 hover:bg-brass-700 active:bg-brass-800 text-cream-50 shadow-parchment border border-brass-500 focus-visible:ring-brass-500 hover:shadow-brass-glow',
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
