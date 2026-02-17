import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  action?: React.ReactNode;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, className = '', title, action, onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-apple-lg shadow-ios flex flex-col transition-all duration-200 ease-apple ${onClick ? 'active:scale-[0.98] cursor-pointer hover:shadow-ios-md' : ''} ${className}`}
    >
      {(title || action) && (
        <div className="px-5 py-4 border-b border-secondary-100/50 flex justify-between items-center flex-shrink-0">
          {title && <h3 className="text-lg font-semibold text-gray-900 tracking-tight">{title}</h3>}
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="p-5 flex-1 min-h-0">
        {children}
      </div>
    </div>
  );
};

export default Card;