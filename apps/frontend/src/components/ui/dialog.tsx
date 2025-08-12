import React from 'react';

export const Dialog = ({ children, ...props }: any) => <div {...props}>{children}</div>;
export const DialogContent = ({ children, ...props }: any) => 
  <div className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg" {...props}>{children}</div>;
export const DialogHeader = ({ children, ...props }: any) => 
  <div className="flex flex-col space-y-1.5 text-center sm:text-left" {...props}>{children}</div>;
export const DialogTitle = ({ children, ...props }: any) => 
  <h2 className="text-lg font-semibold leading-none tracking-tight" {...props}>{children}</h2>;
export const DialogTrigger = ({ children, ...props }: any) => <div {...props}>{children}</div>;
export const DialogDescription = ({ children, ...props }: any) => 
  <p className="text-sm text-muted-foreground" {...props}>{children}</p>;
