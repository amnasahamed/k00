import React, { InputHTMLAttributes } from 'react';
import { numberToWords } from '../../utils/format';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    fullWidth?: boolean;
    leftIcon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
    label,
    error,
    className = '',
    fullWidth = false,
    leftIcon,
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
                {leftIcon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400">
                        {leftIcon}
                    </div>
                )}
                <input
                    className={`
            block px-4 py-3 
            bg-secondary-100 border-none rounded-apple 
            text-secondary-900 placeholder-secondary-400
            focus:ring-2 focus:ring-primary/20 focus:bg-white 
            transition-all duration-200 ease-apple
            disabled:opacity-50 disabled:cursor-not-allowed
            ${leftIcon ? 'pl-10' : ''}
            ${error ? 'ring-2 ring-danger/20 bg-danger/5' : ''}
            ${fullWidth ? 'w-full' : ''}
            ${className}
          `}
                    {...props}
                />
            </div>
            {props.type === 'number' && props.value !== undefined && props.value !== '' && !isNaN(Number(props.value)) && Number(props.value) !== 0 && (
                <p className="text-[10px] font-bold text-primary-600/70 uppercase tracking-widest pl-1 animate-in fade-in slide-in-from-top-1 duration-300">
                    {numberToWords(Number(props.value))}
                </p>
            )}
            {error && (
                <p className="text-xs text-danger mt-1">{error}</p>
            )}
        </div>
    );
};


export default Input;
