import React, { useEffect, useId } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';

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
export const PortalModal: React.FC<PortalModalProps> = ({ open, onClose, title, subtitle, widthClass = 'max-w-[480px]', children }) => {
    const titleId = useId();
    useBodyScrollLock(open);

    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [open, onClose]);

    // Rendered into <body>, not in place. Inline, the overlay sat inside the
    // screen's animated wrapper, and a `position: fixed` element is laid out
    // against its nearest transformed ancestor, not the window — so while that
    // wrapper carried a transform the dialog appeared at the screen's size and
    // then snapped to full size (QA: the bank form "opened small, then grew").
    return createPortal(
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
                        className={`pt-card w-full ${widthClass} max-h-[calc(100vh-2rem)] overflow-y-auto overscroll-contain px-6 py-[22px]`}
                        // Fade only. The old scale-and-slide made every dialog open visibly
                        // small and then grow (QA: the bank form "resized" as it opened).
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.16 }}
                        onClick={(e: React.MouseEvent) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between gap-3 mb-1">
                            <h2 id={titleId} className="pt-h-sec">
                                {title}
                            </h2>
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
        </AnimatePresence>,
        document.body
    );
};
