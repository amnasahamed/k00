import React, { useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  removeToast: (id: string) => void;
}

const ToastContainer: React.FC<ToastProps> = ({ toasts, removeToast }) => {
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <ToastItem key={t.id} {...t} onRemove={() => removeToast(t.id)} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<ToastMessage & { onRemove: () => void }> = ({ type, message, onRemove }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onRemove]);

  const styles = {
    success: 'bg-success/10 text-success border-success/30 backdrop-blur-xl',
    error: 'bg-danger/10 text-danger border-danger/30 backdrop-blur-xl',
    info: 'bg-primary/10 text-primary border-primary/30 backdrop-blur-xl'
  };

  const icons = {
    success: (
      <svg className="w-5 h-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    ),
    error: (
      <svg className="w-5 h-5 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
    info: (
      <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  };

  return (
    <div className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-apple shadow-ios-lg border animate-slide-up ${styles[type]}`}>
      {icons[type]}
      <p className="text-sm font-medium tracking-tight">{message}</p>
    </div>
  );
};

export default ToastContainer;