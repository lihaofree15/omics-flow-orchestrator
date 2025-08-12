import React from 'react';

export const DropdownMenu = ({ children, ...props }: any) => <div {...props}>{children}</div>;
export const DropdownMenuContent = ({ children, ...props }: any) => 
  <div className="z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md" {...props}>{children}</div>;
export const DropdownMenuItem = ({ children, ...props }: any) => 
  <div className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50" {...props}>{children}</div>;
export const DropdownMenuTrigger = ({ children, ...props }: any) => <div {...props}>{children}</div>;
export const DropdownMenuLabel = ({ children, ...props }: any) => 
  <div className="px-2 py-1.5 text-sm font-semibold" {...props}>{children}</div>;
export const DropdownMenuSeparator = ({ ...props }: any) => 
  <div className="-mx-1 my-1 h-px bg-muted" {...props} />;