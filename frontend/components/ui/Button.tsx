import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}) => {
  const baseStyles = "inline-flex items-center justify-center rounded-apple font-semibold transition-all duration-200 ease-apple active:scale-[0.97] focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100";

  const variants = {
    primary: "bg-[#007AFF] text-white hover:bg-[#0062CC] shadow-ios active:shadow-none",
    secondary: "bg-secondary-100 text-secondary-900 hover:bg-secondary-200 active:bg-secondary-300",
    danger: "bg-[#FF3B30] text-white hover:bg-[#D70015] shadow-ios active:shadow-none",
    ghost: "bg-transparent text-[#007AFF] hover:bg-[#007AFF]/10 active:bg-[#007AFF]/20"
  };

  const sizes = {
    sm: "px-3.5 py-2 text-xs tracking-tight",
    md: "px-6 py-3 text-sm tracking-tight",
    lg: "px-8 py-3.5 text-base tracking-tight"
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;