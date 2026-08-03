import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    Ghost, Loader2, AlertCircle, WifiOff, Snail, SearchX,
    Lock, Clock, AlertTriangle, CheckCircle2, RefreshCw
} from 'lucide-react';

// ── Shared Wrapper ──
const StateWrapper: React.FC<{ children: React.ReactNode; className?: string; minHeight?: string }> = ({ children, className = '', minHeight = 'min-h-[400px]' }) => (
    <div className={`flex flex-col items-center justify-center p-8 text-center ${minHeight} ${className}`}>
        {children}
    </div>
);

// ── 1. Empty State ──
export const EmptyState: React.FC<{ title: string; desc: string; icon?: React.ElementType; action?: React.ReactNode }> = ({
    title, desc, icon: Icon = Ghost, action
}) => (
    <StateWrapper>
        <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 mb-6 border border-gray-100 shadow-sm"
        >
            <Icon size={32} strokeWidth={1.5} />
        </motion.div>
        <h3 className="text-xl font-black text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-500 max-w-sm mb-6 leading-relaxed">{desc}</p>
        {action}
    </StateWrapper>
);

// ── 2. Loading State ──
export const LoadingState: React.FC<{ msg?: string; minHeight?: string }> = ({ msg = 'Loading details...', minHeight }) => (
    <StateWrapper minHeight={minHeight}>
        <motion.div
            animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="text-tlb-blue mb-4"
        >
            <Loader2 size={32} />
        </motion.div>
        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">{msg}</p>
    </StateWrapper>
);

// ── 3. Error State ──
export const ErrorState: React.FC<{ title?: string; desc?: string; onRetry?: () => void }> = ({
    title = 'Something went wrong', desc = 'We encountered an error loading this data.', onRetry
}) => (
    <StateWrapper>
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mb-5"
        >
            <AlertCircle size={32} />
        </motion.div>
        <h3 className="text-lg font-black text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-500 max-w-sm mb-6">{desc}</p>
        {onRetry && (
            <button onClick={onRetry} className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-gray-800 transition-colors">
                <RefreshCw size={16} /> Try Again
            </button>
        )}
    </StateWrapper>
);

// ── 4. No Internet State (Global Overlay or In-place) ──
export const NoInternetState: React.FC<{ inline?: boolean }> = ({ inline = false }) => {
    const content = (
        <StateWrapper minHeight={inline ? 'min-h-[300px]' : 'min-h-screen'}>
            <motion.div
                initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
                className="w-24 h-24 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mb-6 shadow-inner"
            >
                <WifiOff size={40} />
            </motion.div>
            <h3 className="text-2xl font-black text-gray-900 mb-2">You're Offline</h3>
            <p className="text-sm text-gray-500 max-w-sm">Please check your internet connection. We'll automatically reconnect when you're back online.</p>
        </StateWrapper>
    );
    if (inline) return content;
    return (
        <div className="fixed inset-0 bg-white/95 backdrop-blur-md z-[9999] flex items-center justify-center">
            {content}
        </div>
    );
};

// ── 5. Slow Network State (Toast or Banner) ──
export const SlowNetworkBanner: React.FC = () => (
    <motion.div
        initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -50 }}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-amber-50 text-amber-700 px-4 py-2.5 rounded-full border border-amber-200 shadow-sm flex items-center gap-3 text-sm font-bold"
    >
        <Snail size={16} /> Network is responding slowly...
    </motion.div>
);

// ── 6. No Search Result State ──
export const NoSearchResultState: React.FC<{ query: string; onClear: () => void }> = ({ query, onClear }) => (
    <StateWrapper>
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="text-gray-300 mb-5"
        >
            <SearchX size={48} strokeWidth={1.5} />
        </motion.div>
        <h3 className="text-lg font-black text-gray-900 mb-1">No results found</h3>
        <p className="text-sm text-gray-500 mb-5">We couldn't find anything matching "{query}".</p>
        <button onClick={onClear} className="text-tlb-blue font-bold text-sm hover:underline">
            Clear search
        </button>
    </StateWrapper>
);

// ── 7. Permission Denied State ──
export const PermissionDeniedState: React.FC<{ feature: string }> = ({ feature }) => (
    <StateWrapper>
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="w-16 h-16 bg-gray-100 text-gray-400 rounded-2xl flex items-center justify-center mb-5"
        >
            <Lock size={32} />
        </motion.div>
        <h3 className="text-xl font-black text-gray-900 mb-2">Access Restricted</h3>
        <p className="text-sm text-gray-500 max-w-sm mb-6">You don't have permission to access {feature}. Please contact support if you believe this is an error.</p>
    </StateWrapper>
);

// ── 8. Session Expired State (Modal Overlay) ──
export const SessionExpiredState: React.FC<{ onLogin: () => void }> = ({ onLogin }) => (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
        <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl"
        >
            <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <Clock size={32} />
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2">Session Expired</h3>
            <p className="text-sm text-gray-500 mb-8">For your security, you've been logged out due to inactivity. Please log in again to continue.</p>
            <button onClick={onLogin} className="w-full bg-tlb-blue text-white py-3 rounded-xl font-black text-sm hover:bg-blue-700 transition-colors">
                Log In Again
            </button>
        </motion.div>
    </div>
);

// ── 9. Form Validation State (Inline Wrapper) ──
export const FormValidationState: React.FC<{ error?: string; children: React.ReactNode }> = ({ error, children }) => {
    return (
        <div className="flex flex-col gap-1.5 w-full">
            <motion.div
                animate={error ? { x: [-2, 2, -2, 2, 0] } : {}}
                transition={{ duration: 0.3 }}
            >
                {children}
            </motion.div>
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -5, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                        exit={{ opacity: 0, y: -5, height: 0 }}
                        className="flex items-center gap-1.5 text-rose-500 text-xs font-bold px-1"
                    >
                        <AlertTriangle size={12} /> {error}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// ── 10. Success State ──
export const SuccessState: React.FC<{ title: string; desc?: string; action?: React.ReactNode; minHeight?: string }> = ({
    title, desc, action, minHeight
}) => (
    <StateWrapper minHeight={minHeight}>
        <motion.div
            initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', bounce: 0.5 }}
            className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-5"
        >
            <CheckCircle2 size={40} />
        </motion.div>
        <h3 className="text-2xl font-black text-gray-900 mb-2">{title}</h3>
        {desc && <p className="text-sm text-gray-500 max-w-sm mb-8">{desc}</p>}
        {action}
    </StateWrapper>
);
