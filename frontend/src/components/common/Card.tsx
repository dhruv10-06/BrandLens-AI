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
    default: 'bg-white rounded-2xl border border-[#EAE8E3] shadow-card',
    interactive:
      'bg-white rounded-2xl border border-[#EAE8E3] shadow-card hover:border-[#DDD5C2] hover:shadow-card-hover transition-all duration-200',
    accent:
      'bg-gradient-to-br from-graphite-950 via-[#2A244D] to-graphite-900 text-white rounded-2xl shadow-elevated border border-graphite-800',
    subtle: 'bg-ivory-50/90 rounded-2xl border border-[#EAE8E3] shadow-subtle',
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
    <div className={`p-5 sm:p-6 border-b border-[#F2EFE8] flex items-center justify-between gap-4 ${className}`} {...props}>
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
    <div className={`p-4 sm:p-5 border-t border-[#F2EFE8] bg-ivory-50/60 rounded-b-2xl flex items-center justify-between gap-4 ${className}`} {...props}>
      {children}
    </div>
  );
};