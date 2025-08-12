import React from 'react';

export interface CheckboxProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  className?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className = '', checked, onCheckedChange, ...props }, ref) => {
    return (
      <input
        ref={ref}
        type="checkbox"
        checked={checked}
        onChange={(e) => onCheckedChange?.(e.target.checked)}
        className={`h-4 w-4 rounded border border-primary text-primary focus:ring-2 focus:ring-primary ${className}`}
        {...props}
      />
    );
  }
);
Checkbox.displayName = 'Checkbox';
