'use client';

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
  icon?: string;
}

interface ToastContextType {
  showToast: (message: string, type?: 'success' | 'error' | 'info', icon?: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

// Global toast function for use outside React components
let globalShowToast: ((message: string, type?: 'success' | 'error' | 'info', icon?: string) => void) | null = null;

export function showToastGlobal(message: string, type: 'success' | 'error' | 'info' = 'success', icon?: string) {
  if (globalShowToast) {
    globalShowToast(message, type, icon);
  }
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    // Return a no-op function if not in provider (for standalone use)
    return { showToast: showToastGlobal };
  }
  return context;
}

export function ToastProvider({ children }: { children?: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success', icon?: string) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type, icon }]);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  // Register global toast function
  useEffect(() => {
    globalShowToast = showToast;
    return () => {
      globalShowToast = null;
    };
  }, [showToast]);

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const typeClasses = {
    success: 'bg-emerald-500 text-white',
    error: 'bg-red-500 text-white',
    info: 'bg-blue-500 text-white',
  };

  const defaultIcons = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`${typeClasses[toast.type]} px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 min-w-[280px] animate-slide-up cursor-pointer hover:opacity-90 transition-opacity`}
            onClick={() => removeToast(toast.id)}
          >
            <span className="text-xl">{toast.icon || defaultIcons[toast.type]}</span>
            <span className="font-medium">{toast.message}</span>
          </div>
        ))}
      </div>

      <style jsx global>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </ToastContext.Provider>
  );
}
