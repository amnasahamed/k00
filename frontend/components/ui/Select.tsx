import React, { SelectHTMLAttributes } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    fullWidth?: boolean;
    options: { value: string | number; label: string }[];
}

export const Select: React.FC<SelectProps> = ({
    label,
    error,
    className = '',
    fullWidth = false,
    options,
    ...props
}) => {
    return (
        <div className={`${fullWidth ? 'w-full' : ''} space-y-1`}>
            {label && (
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {label}
                </label>
            )}
            <div className="relative">
                <select
                    className={`
                        block appearance-none px-4 py-3 
                        bg-gray-100 border-none rounded-apple 
                        text-gray-900 
                        focus:ring-2 focus:ring-primary/20 focus:bg-white 
                        transition-all duration-200 ease-apple
                        disabled:opacity-50 disabled:cursor-not-allowed
                        ${error ? 'ring-2 ring-danger/20 bg-danger/5' : ''}
                        ${fullWidth ? 'w-full' : 'w-full'}
                        ${className}
                    `}
                    {...props}
                >
                    {options.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-400">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>
            {error && (
                <p className="text-xs text-danger mt-1">{error}</p>
            )}
        </div>
    );
};

export default Select;
