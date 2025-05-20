import { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}: ButtonProps) => {
  const baseStyles = 'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantStyles = {
    primary: 'bg-[#6e5d46] text-[#f0f0f0] hover:bg-[#6e5d46]/90 focus:ring-[#6e5d46]/50',
    secondary: 'bg-[#d4c8a9] text-[#6e5d46] hover:bg-[#d4c8a9]/80 focus:ring-[#6e5d46]/30',
    outline: 'bg-transparent text-[#6e5d46] border border-[#6e5d46] hover:bg-[#d4c8a9]/50 focus:ring-[#6e5d46]/30',
    ghost: 'bg-transparent text-[#6e5d46] hover:bg-[#d4c8a9]/50 focus:ring-[#6e5d46]/30',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
  };
  
  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5',
    md: 'text-sm px-4 py-2',
    lg: 'text-base px-6 py-3',
  };
  
  const widthStyles = fullWidth ? 'w-full' : '';
  const disabledStyles = disabled || isLoading ? 'opacity-70 cursor-not-allowed' : '';
  
  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyles} ${disabledStyles} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <span className="w-4 h-4 mr-2 border-2 border-t-transparent border-current rounded-full animate-spin" />
      )}
      {!isLoading && leftIcon && <span className="mr-2">{leftIcon}</span>}
      {children}
      {!isLoading && rightIcon && <span className="ml-2">{rightIcon}</span>}
    </button>
  );
};

export default Button;