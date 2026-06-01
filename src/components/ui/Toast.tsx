import React, { useCallback, useState } from 'react';
import { AlertTriangle, CheckCircle2, X } from 'lucide-react';

export type ToastType = 'error' | 'success' | 'warning' | 'info';

export interface ToastItem {
    id: number;
    message: string;
    type: ToastType;
}

let toastSeq = 0;

export function useToasts() {
    const [toasts, setToasts] = useState<ToastItem[]>([]);

    const showToast = useCallback((message: string, type: ToastType = 'error', durationMs = 5000) => {
        const id = ++toastSeq;
        setToasts((prev) => [...prev, { id, message, type }]);
        if (durationMs > 0) {
            setTimeout(() => {
                setToasts((prev) => prev.filter((t) => t.id !== id));
            }, durationMs);
        }
        return id;
    }, []);

    const dismissToast = useCallback((id: number) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    return { toasts, showToast, dismissToast };
}

export const ToastContainer: React.FC<{
    toasts: ToastItem[];
    onDismiss: (id: number) => void;
}> = ({ toasts, onDismiss }) => (
    <>
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-[90vw] max-w-md pointer-events-none">
            {toasts.map((toast) => {
                const palette =
                    toast.type === 'error'
                        ? 'bg-red-50/95 border-red-200 text-red-800'
                        : toast.type === 'warning'
                        ? 'bg-amber-50/95 border-amber-200 text-amber-800'
                        : toast.type === 'info'
                        ? 'bg-blue-50/95 border-blue-200 text-blue-800'
                        : 'bg-emerald-50/95 border-emerald-200 text-emerald-800';
                const iconColor =
                    toast.type === 'error'
                        ? 'text-red-500'
                        : toast.type === 'warning'
                        ? 'text-amber-500'
                        : toast.type === 'info'
                        ? 'text-blue-500'
                        : 'text-emerald-500';
                const Icon = toast.type === 'success' ? CheckCircle2 : AlertTriangle;
                return (
                    <div
                        key={toast.id}
                        className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl shadow-2xl border backdrop-blur-sm animate-slide-in-toast ${palette}`}
                    >
                        <div className={`shrink-0 mt-0.5 ${iconColor}`}>
                            <Icon size={18} />
                        </div>
                        <p className="flex-1 text-sm font-semibold leading-snug">{toast.message}</p>
                        <button
                            onClick={() => onDismiss(toast.id)}
                            className="shrink-0 p-0.5 rounded-lg hover:bg-black/5 transition-colors"
                            aria-label="Dismiss"
                        >
                            <X size={14} />
                        </button>
                    </div>
                );
            })}
        </div>
        <style>{`
            @keyframes slide-in-toast {
                from { opacity: 0; transform: translate(-50%, -16px) scale(0.96); }
                to { opacity: 1; transform: translate(-50%, 0) scale(1); }
            }
            .animate-slide-in-toast {
                animation: slide-in-toast 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            }
        `}</style>
    </>
);
