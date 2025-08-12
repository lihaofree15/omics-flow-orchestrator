import React from 'react';

export const Popover = ({ children, ...props }: any) => <div {...props}>{children}</div>;

export const PopoverContent = ({ children, className = '', ...props }: any) => 
  <div className={`z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none ${className}`} {...props}>{children}</div>;

export const PopoverTrigger = ({ children, ...props }: any) => <div {...props}>{children}</div>;
