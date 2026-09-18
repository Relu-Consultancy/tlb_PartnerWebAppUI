import React from 'react';
import { Check, IndianRupee, MessageCircle, PanelTop, Star } from 'lucide-react';
import { SummaryIcon, SummaryLine } from '../dashboardModel';
import { IconTile } from '../../../components/portal';

const ICONS: Record<SummaryIcon, React.ElementType> = {
    message: MessageCircle,
    check: Check,
    rupee: IndianRupee,
    listings: PanelTop,
    star: Star,
};

export const ActivitySummary: React.FC<{ lines: SummaryLine[]; periodLabel: string }> = ({ lines, periodLabel }) => (
    <section className="pt-card px-[18px] py-4" aria-labelledby="summary-heading">
        <div className="flex items-baseline gap-2 mb-1">
            <h2 id="summary-heading" className="pt-h-sec">Activity summary</h2>
            <span className="text-[11.5px] text-tlb-muted">{periodLabel}</span>
        </div>
        <ul>
            {lines.map(line => (
                <li key={line.id} className="pt-row py-[5px]">
                    <IconTile tone={line.tone} icon={ICONS[line.icon]} />
                    <span className="flex-1 text-[12.5px] text-tlb-body">{line.text}</span>
                </li>
            ))}
        </ul>
    </section>
);
