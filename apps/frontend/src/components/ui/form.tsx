import React from 'react';

export const Form = ({ children, ...props }: any) => <form {...props}>{children}</form>;
export const FormField = ({ children, ...props }: any) => <div {...props}>{children}</div>;
export const FormItem = ({ children, className = '', ...props }: any) => 
  <div className={`space-y-2 ${className}`} {...props}>{children}</div>;
export const FormLabel = ({ children, className = '', ...props }: any) => 
  <label className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`} {...props}>{children}</label>;
export const FormControl = ({ children, ...props }: any) => <div {...props}>{children}</div>;
export const FormDescription = ({ children, className = '', ...props }: any) => 
  <p className={`text-sm text-muted-foreground ${className}`} {...props}>{children}</p>;
export const FormMessage = ({ children, className = '', ...props }: any) => 
  <p className={`text-sm font-medium text-destructive ${className}`} {...props}>{children}</p>;
