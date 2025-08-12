import React from 'react';

export const Command = ({ children, className = '', ...props }: any) => 
  <div className={`flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground ${className}`} {...props}>{children}</div>;

export const CommandInput = ({ className = '', ...props }: any) => 
  <input className={`flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 ${className}`} {...props} />;

export const CommandList = ({ children, className = '', ...props }: any) => 
  <div className={`max-h-[300px] overflow-y-auto overflow-x-hidden ${className}`} {...props}>{children}</div>;

export const CommandEmpty = ({ children, className = '', ...props }: any) => 
  <div className={`py-6 text-center text-sm ${className}`} {...props}>{children}</div>;

export const CommandGroup = ({ children, className = '', ...props }: any) => 
  <div className={`overflow-hidden p-1 text-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground ${className}`} {...props}>{children}</div>;

export const CommandItem = ({ children, className = '', ...props }: any) => 
  <div className={`relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 ${className}`} {...props}>{children}</div>;
