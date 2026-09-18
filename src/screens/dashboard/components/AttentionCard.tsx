import React from 'react';
import { AlertCircle, CheckCircle2, Landmark, MessageCircle, ShieldCheck, Star, XCircle } from 'lucide-react';
import { AttentionAction, AttentionIcon, AttentionItem } from '../dashboardModel';
import { CountBadge, IconTile } from '../../../components/portal';

const ICONS: Record<AttentionIcon, React.ElementType> = {
    alert: AlertCircle,
    rejected: XCircle,
    message: MessageCircle,
    star: Star,
    shield: ShieldCheck,
    bank: Landmark,
};

interface AttentionCardProps {
    items: AttentionItem[];
    onSelect: (action: AttentionAction) => void;
}

export const AttentionCard: React.FC<AttentionCardProps> = ({ items, onSelect }) => (
    <section className="pt-card px-[18px] py-4" aria-labelledby="attention-heading">
        <h2 id="attention-heading" className="pt-h-sec mb-2.5">Needs your attention</h2>
        {items.length === 0 ? (
            <div className="pt-note">
                <CheckCircle2 size={16} strokeWidth={2.75} className="text-tlb-green flex-none" />
                You’re all caught up — nothing needs action right now.
            </div>
        ) : (
            <ul className="flex flex-col gap-[9px]">
                {items.map(item => (
                    <li key={item.id}>
                        <button type="button" className="pt-action" onClick={() => onSelect(item.action)}>
                            <IconTile tone={item.tone} icon={ICONS[item.icon]} size="md" />
                            <span className="flex-1 min-w-0">
                                <span className="block text-[13px] font-bold text-tlb-ink leading-snug">{item.title}</span>
                                {item.subtitle && (
                                    <span className="block text-[10.5px] text-tlb-muted mt-px truncate">{item.subtitle}</span>
                                )}
                            </span>
                            {item.count ? <CountBadge count={item.count} /> : null}
                        </button>
                    </li>
                ))}
            </ul>
        )}
    </section>
);
