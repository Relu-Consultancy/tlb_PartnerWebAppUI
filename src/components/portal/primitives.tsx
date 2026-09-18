import React from 'react';

// ---------------------------------------------------------------------------
// Small presentational building blocks for portal screens (see portal.css).
// ---------------------------------------------------------------------------

export type Tone = 'amber' | 'green' | 'blue' | 'purple' | 'red' | 'neutral';

/** Soft background + readable foreground pairs from the portal palette. */
export const TONE_CLASSES: Record<Tone, string> = {
    amber: 'bg-tlb-amber-soft text-tlb-gold',
    green: 'bg-tlb-green-soft text-tlb-green',
    blue: 'bg-tlb-blue-soft text-tlb-blue',
    purple: 'bg-tlb-purple-soft text-tlb-purple',
    red: 'bg-tlb-red-soft text-tlb-red-deep',
    neutral: 'bg-tlb-hover text-tlb-sub',
};

export const Pill: React.FC<{ tone: Tone; children: React.ReactNode; className?: string }> = ({
    tone, children, className = '',
}) => <span className={`pt-pill ${TONE_CLASSES[tone]} ${className}`}>{children}</span>;

/** Red numeric badge; renders nothing for zero. */
export const CountBadge: React.FC<{ count: number; label?: string; small?: boolean; className?: string }> = ({
    count, label, small = false, className = '',
}) => {
    if (count <= 0) return null;
    return (
        <span className={`pt-count ${small ? 'is-sm' : ''} ${className}`} aria-label={label}>
            {count > 99 ? '99+' : count}
        </span>
    );
};

export const IconTile: React.FC<{ tone: Tone; icon: React.ElementType; size?: 'sm' | 'md' }> = ({
    tone, icon: Icon, size = 'sm',
}) => (
    <span className={`${size === 'sm' ? 'pt-tile-sm' : 'pt-tile-md'} ${TONE_CLASSES[tone]}`} aria-hidden="true">
        <Icon size={size === 'sm' ? 13 : 16} strokeWidth={2.75} />
    </span>
);
