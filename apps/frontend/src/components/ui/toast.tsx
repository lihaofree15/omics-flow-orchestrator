import React from 'react';

export const toast = {
  success: (message: string) => console.log('Success:', message),
  error: (message: string) => console.error('Error:', message),
  info: (message: string) => console.info('Info:', message),
  warning: (message: string) => console.warn('Warning:', message)
};

export const useToast = () => ({
  toast: toast.success,
  toasts: [],
  dismiss: () => {}
});

export const Toast = ({ children, ...props }: any) => <div {...props}>{children}</div>;
export const ToastAction = ({ children, ...props }: any) => <button {...props}>{children}</button>;
export const ToastClose = ({ ...props }: any) => <button {...props}>×</button>;
export const ToastDescription = ({ children, ...props }: any) => <div {...props}>{children}</div>;
export const ToastProvider = ({ children, ...props }: any) => <div {...props}>{children}</div>;
export const ToastTitle = ({ children, ...props }: any) => <div {...props}>{children}</div>;
export const ToastViewport = ({ children, ...props }: any) => <div {...props}>{children}</div>;