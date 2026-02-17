import React from 'react';

interface BadgeProps {
    children: React.ReactNode;
    variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'outline';
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
    children,
    variant = 'neutral',
    size = 'md',
    className = ''
}) => {
    const baseStyles = "inline-flex items-center font-semibold rounded-full";

    const variants = {
        primary: "bg-primary/10 text-primary-600 border border-primary/20",
        success: "bg-success/10 text-success-800 border border-success/20",
        warning: "bg-warning/10 text-warning-800 border border-warning/20",
        danger: "bg-danger/10 text-danger-800 border border-danger/20",
        info: "bg-primary/10 text-primary-600 border border-primary/20",
        neutral: "bg-secondary-100 text-secondary-600 border border-secondary-200",
        outline: "bg-transparent border border-secondary-300 text-secondary-600"
    };

    const sizes = {
        sm: "px-2 py-0.5 text-[10px]",
        md: "px-2.5 py-0.5 text-xs",
        lg: "px-3 py-1 text-sm"
    };

    return (
        <span className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}>
            {children}
        </span>
    );
};

export default Badge;
