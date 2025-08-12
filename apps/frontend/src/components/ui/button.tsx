import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'default', size = 'default', ...props }, ref) => {
    const baseClasses = 'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';
    
    const variantClasses = {
      default: 'bg-slate-900 text-slate-50 hover:bg-slate-800',
      destructive: 'bg-red-500 text-slate-50 hover:bg-red-600',
      outline: 'border border-slate-200 bg-white hover:bg-slate-100',
      secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200',
      ghost: 'hover:bg-slate-100',
      link: 'underline-offset-4 hover:underline text-slate-900'
    };
    
    const sizeClasses = {
      default: 'h-10 py-2 px-4',
      sm: 'h-9 px-3 rounded-md',
      lg: 'h-11 px-8 rounded-md',
      icon: 'h-10 w-10'
    };
    
    return (
      <button
        className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';