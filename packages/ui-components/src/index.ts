// Placeholder UI components export for build compatibility
// The actual UI components will be used directly from the ui directory in the deployed application

export const placeholder = "UI components package built successfully";

// Export common UI component interfaces for TypeScript compatibility
export interface ComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface ButtonProps extends ComponentProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export interface CardProps extends ComponentProps {
  // Card component props
}

export interface InputProps extends ComponentProps {
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: any) => void;
}