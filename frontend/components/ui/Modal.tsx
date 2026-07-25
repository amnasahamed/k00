import React, { useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'md' }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
    }
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'md:max-w-md',
    md: 'md:max-w-lg',
    lg: 'md:max-w-2xl',
    xl: 'md:max-w-4xl',
    '2xl': 'md:max-w-6xl',
    full: 'md:max-w-[95vw]'
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
      style={{ zIndex: 999999 }}
      onClick={onClose}
    >
      {/* Desktop: Centered Modal | Mobile: Full Screen Slide-up */}
      <div
        className="
          fixed
          md:inset-0 md:flex md:items-center md:justify-center md:p-6
          inset-x-0 bottom-0 top-auto
        "
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`
            bg-white/95 backdrop-blur-md shadow-ios-xl flex flex-col
            w-full
            ${sizeClasses[size]} md:max-h-[85vh] md:rounded-apple-xl
            max-h-[92vh] rounded-t-[28px] rounded-b-none
            animate-slide-up md:animate-scale-in
          `}
          style={{ zIndex: 9999999 }}
        >
          {/* Mobile: Drag Handle */}
          <div className="md:hidden flex justify-center pt-3 pb-1">
            <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 md:px-6 py-4 md:py-5 border-b border-gray-100/50 sticky top-0 bg-transparent z-50">
            <h2 className="text-lg md:text-xl font-semibold text-gray-900 tracking-tight">{title}</h2>
            <button
              onClick={onClose}
              className="w-9 h-9 md:w-8 md:h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 active:bg-gray-300 transition-all duration-200 ease-apple active:scale-95"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto overscroll-contain px-5 md:px-6 py-5 md:py-6 pb-8 md:pb-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
