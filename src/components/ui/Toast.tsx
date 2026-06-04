import React, { useCallback, useState, useSyncExternalStore } from 'react';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';

export type ToastType = 'error' | 'success' | 'warning' | 'info';

export interface ToastItem {
    id: number;
    title: string;
    message: string;
    type: ToastType;
}

export interface ToastOptions {
    /** Heading shown in bold. Defaults to a per-type label ("Success!", "Error", …). */
    title?: string;
    /** Auto-dismiss after this many ms. 0 keeps it until dismissed. Default 5000. */
    duration?: number;
}

// ---------------------------------------------------------------------------
// Singleton store — lets any module fire a toast via `toast.error(...)`,
// while a single <Toaster /> mounted at the app root renders them all.
// ---------------------------------------------------------------------------
const DEFAULT_TITLES: Record<ToastType, string> = {
    success: 'Success!',
    error: 'Error',
    warning: 'Warning',
    info: 'Info',
};

let items: ToastItem[] = [];
let seq = 0;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((l) => l());

const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
};

const getSnapshot = () => items;

const dismiss = (id: number) => {
    items = items.filter((t) => t.id !== id);
    emit();
};

const show = (type: ToastType, message: string, options: ToastOptions = {}) => {
    const id = ++seq;
    const { title = DEFAULT_TITLES[type], duration = 5000 } = options;
    items = [...items, { id, type, title, message }];
    emit();
    if (duration > 0) {
        setTimeout(() => dismiss(id), duration);
    }
    return id;
};

/**
 * Imperative, app-wide toast API. Import and call from anywhere:
 *   toast.error('Failed to archive listing');
 *   toast.success('Saved!', { title: 'All set' });
 */
export const toast = {
    success: (message: string, options?: ToastOptions) => show('success', message, options),
    error: (message: string, options?: ToastOptions) => show('error', message, options),
    warning: (message: string, options?: ToastOptions) => show('warning', message, options),
    info: (message: string, options?: ToastOptions) => show('info', message, options),
    dismiss,
};

// ---------------------------------------------------------------------------
// Presentation
// ---------------------------------------------------------------------------
const PALETTE: Record<ToastType, {
    bar: string; bg: string; ring: string; title: string; text: string; icon: React.ElementType; iconColor: string;
}> = {
    success: { bar: 'bg-emerald-500', bg: 'bg-emerald-50', ring: 'ring-emerald-100', title: 'text-emerald-800', text: 'text-emerald-700', icon: CheckCircle2, iconColor: 'text-emerald-500' },
    error:   { bar: 'bg-red-500',     bg: 'bg-red-50',     ring: 'ring-red-100',     title: 'text-red-800',     text: 'text-red-700',     icon: XCircle,       iconColor: 'text-red-500' },
    warning: { bar: 'bg-amber-500',   bg: 'bg-amber-50',   ring: 'ring-amber-100',   title: 'text-amber-800',   text: 'text-amber-700',   icon: AlertTriangle, iconColor: 'text-amber-500' },
    info:    { bar: 'bg-blue-500',    bg: 'bg-blue-50',    ring: 'ring-blue-100',    title: 'text-blue-800',    text: 'text-blue-700',    icon: Info,          iconColor: 'text-blue-500' },
};

const ToastCard: React.FC<{ toast: ToastItem; onDismiss: (id: number) => void }> = ({ toast, onDismiss }) => {
    const p = PALETTE[toast.type];
    const Icon = p.icon;
    return (
        <div
            role="alert"
            className={`pointer-events-auto relative w-full overflow-hidden rounded-xl ${p.bg} shadow-xl ring-1 ${p.ring} animate-slide-in-toast`}
        >
            {/* coloured top accent bar */}
            <div className={`absolute inset-x-0 top-0 h-1.5 ${p.bar}`} />
            <button
                onClick={() => onDismiss(toast.id)}
                aria-label="Dismiss"
                className={`absolute top-2.5 right-2.5 p-1 rounded-lg ${p.text} hover:bg-black/5 transition-colors`}
            >
                <X size={16} />
            </button>
            <div className="flex items-start gap-3 px-4 pb-4 pt-4 pr-10">
                <div className={`shrink-0 mt-0.5 ${p.iconColor}`}>
                    <Icon size={20} />
                </div>
                <div className="min-w-0 flex-1">
                    <h4 className={`text-[15px] font-bold leading-tight ${p.title}`}>{toast.title}</h4>
                    {toast.message && (
                        <p className={`mt-0.5 text-sm leading-snug ${p.text}`}>{toast.message}</p>
                    )}
                </div>
            </div>
        </div>
    );
};

const ToastStack: React.FC<{ toasts: ToastItem[]; onDismiss: (id: number) => void }> = ({ toasts, onDismiss }) => (
    <>
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-3 w-[92vw] max-w-md pointer-events-none">
            {toasts.map((t) => (
                <ToastCard key={t.id} toast={t} onDismiss={onDismiss} />
            ))}
        </div>
        <style>{`
            @keyframes slide-in-toast {
                from { opacity: 0; transform: translateY(-16px) scale(0.96); }
                to { opacity: 1; transform: translateY(0) scale(1); }
            }
            .animate-slide-in-toast {
                animation: slide-in-toast 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            }
        `}</style>
    </>
);

/**
 * Mount ONCE near the app root. Renders every toast fired through the global
 * `toast` API (and through the legacy `useToasts`/`ToastContainer` shims).
 */
export const Toaster: React.FC = () => {
    const toasts = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
    return <ToastStack toasts={toasts} onDismiss={dismiss} />;
};

// ---------------------------------------------------------------------------
// Local hook + container (legacy, still used by auth/onboarding screens)
// ---------------------------------------------------------------------------
// These keep self-contained local state and render through the SAME ToastCard
// design as the global <Toaster />, so the look is unified everywhere. Screens
// that use this pair render their own <ToastContainer /> next to the screen.

let localSeq = 0;

export function useToasts() {
    const [toasts, setToasts] = useState<ToastItem[]>([]);

    const showToast = useCallback((message: string, type: ToastType = 'error', durationMs = 5000) => {
        const id = ++localSeq;
        setToasts((prev) => [...prev, { id, type, title: DEFAULT_TITLES[type], message }]);
        if (durationMs > 0) {
            setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), durationMs);
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
}> = ({ toasts, onDismiss }) => <ToastStack toasts={toasts} onDismiss={onDismiss} />;
