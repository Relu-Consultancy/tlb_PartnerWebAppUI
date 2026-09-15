import React, { useEffect, useId } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';

interface PortalModalProps {
    open: boolean;
    onClose: () => void;
    title: string;
    subtitle?: string;
    /** Tailwind max-width class for the dialog card. */
    widthClass?: string;
    children: React.ReactNode;
}

/** Centered dialog in the portal style — closes on backdrop click or Escape. */
export const PortalModal: React.FC<PortalModalProps> = ({
    open, onClose, title, subtitle, widthClass = 'max-w-[480px]', children,
}) => {
    const titleId = useId();

    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [open, onClose]);

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[rgba(20,19,18,0.45)]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                >
                    <motion.div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby={titleId}
                        className={`pt-card w-full ${widthClass} max-h-[calc(100vh-2rem)] overflow-y-auto px-6 py-[22px]`}
                        initial={{ opacity: 0, y: 8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.98 }}
                        transition={{ duration: 0.16 }}
                        onClick={(e: React.MouseEvent) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between gap-3 mb-1">
                            <h2 id={titleId} className="pt-h-sec">{title}</h2>
                            <button
                                type="button"
                                onClick={onClose}
                                aria-label="Close"
                                className="p-1 -mr-1 rounded-md text-tlb-muted hover:text-tlb-ink hover:bg-tlb-hover transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        {subtitle && <p className="text-xs text-tlb-muted mb-3.5">{subtitle}</p>}
                        {children}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
