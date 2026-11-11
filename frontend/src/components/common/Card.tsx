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
    default: 'bg-[#FDFBF7] rounded-xl border border-[#E7DECE] shadow-parchment',
    interactive:
      'bg-[#FDFBF7] rounded-xl border border-[#E7DECE] shadow-parchment hover:border-brass-600 hover:shadow-parchment-md transition-all duration-200 cursor-pointer',
    accent:
      'bg-[#1C3228] text-cream-50 rounded-xl shadow-parchment-lg border border-forest-800',
    subtle: 'bg-[#F5EFE4] rounded-xl border border-[#DDD2BF] shadow-parchment-sm',
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
    <div className={`p-5 sm:p-6 border-b border-[#EDE6D8] flex items-center justify-between gap-4 ${className}`} {...props}>
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
    <div className={`p-4 sm:p-5 border-t border-[#EDE6D8] bg-[#F7F2E8]/60 rounded-b-xl flex items-center justify-between gap-4 ${className}`} {...props}>
      {children}
    </div>
  );
};
