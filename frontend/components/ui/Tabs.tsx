import React from 'react';

interface TabsProps {
    value: string;
    onValueChange: (value: string) => void;
    children: React.ReactNode;
    className?: string;
}

interface TabsListProps {
    children: React.ReactNode;
    className?: string;
}

interface TabsTriggerProps {
    value: string;
    children: React.ReactNode;
    className?: string;
    // Context will be handled by parent or prop drilling for simplicity in this lightweight implementation
    activeValue?: string;
    onClick?: (value: string) => void;
}

interface TabsContentProps {
    value: string;
    children: React.ReactNode;
    activeValue?: string;
    className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ value, onValueChange, children, className }) => {
    // Clone children to inject props
    const childrenWithProps = React.Children.map(children, child => {
        if (React.isValidElement(child)) {
            return React.cloneElement(child, { activeValue: value, onValueChange } as any);
        }
        return child;
    });

    return <div className={className}>{childrenWithProps}</div>;
};

export const TabsList: React.FC<TabsListProps & { activeValue?: string, onValueChange?: (v: string) => void }> = ({ children, className, activeValue, onValueChange }) => {
    const childrenWithProps = React.Children.map(children, child => {
        if (React.isValidElement(child)) {
            return React.cloneElement(child, { activeValue, onClick: onValueChange } as any);
        }
        return child;
    });
    return <div className={`flex gap-1 bg-secondary-100/50 p-1 rounded-apple mb-6 ${className}`}>{childrenWithProps}</div>;
};

export const TabsTrigger: React.FC<TabsTriggerProps> = ({ value, children, className, activeValue, onClick }) => {
    const isActive = value === activeValue;
    return (
        <button
            type="button"
            onClick={() => onClick && onClick(value)}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-apple transition-all duration-200 ${isActive
                    ? 'bg-white text-primary shadow-ios-sm'
                    : 'text-secondary-500 hover:text-secondary-700 hover:bg-white/50'
                } ${className}`}
        >
            {children}
        </button>
    );
};

export const TabsContent: React.FC<TabsContentProps> = ({ value, children, activeValue, className }) => {
    if (value !== activeValue) return null;
    return <div className={`animate-in fade-in slide-in-from-bottom-2 duration-300 ${className}`}>{children}</div>;
};
