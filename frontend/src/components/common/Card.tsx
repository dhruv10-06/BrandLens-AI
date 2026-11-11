import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'interactive' | 'accent' | 'subtle';
}

export const Card: React.FC<CardProps> = ({
  variant = 'default',
  className = '',
  children,
  ...props
}) => {
  const variantStyles = {
    default: 'bg-white rounded-xl border border-stone-200/90 shadow-card',
    interactive:
      'bg-white rounded-xl border border-stone-200/90 shadow-card hover:border-stone-300 hover:shadow-card-hover transition-all duration-200',
    accent:
      'bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl shadow-elevated border border-slate-800',
    subtle: 'bg-stone-50/80 rounded-xl border border-stone-200/80 shadow-subtle',
  }[variant];

  return (
    <div className={`${variantStyles} ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = '',
  children,
  ...props
}) => {
  return (
    <div className={`p-5 sm:p-6 border-b border-stone-100 flex items-center justify-between gap-4 ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = '',
  children,
  ...props
}) => {
  return (
    <div className={`p-5 sm:p-6 ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = '',
  children,
  ...props
}) => {
  return (
    <div className={`p-4 sm:p-5 border-t border-stone-100 bg-stone-50/40 rounded-b-xl flex items-center justify-between gap-4 ${className}`} {...props}>
      {children}
    </div>
  );
};