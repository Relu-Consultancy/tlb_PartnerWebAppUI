import React, { useState } from 'react';
import { BookOpen, FileSpreadsheet, FileText, Loader2, MessageSquare, Star } from 'lucide-react';
import { Pill } from '../../../components/portal';
import { StatsRevenue } from '../../../api/stats';
import { getAllBookings } from '../../../api/listings';
import { getPartnerReviews } from '../../../api/reviews';
import { toast } from '../../../components/ui';
import { downloadTextFile } from '../../../utils/download';
import { buildBookingsCsv } from '../../dashboard/bookingsCsv';
import { buildEarningsStatementCsv, buildReviewsCsv } from '../csv';

interface ReportsPanelProps {
    revenue: StatsRevenue | null;
}

const fetchAllReviews = async () => {
    const all = [];
    for (let page = 1; page <= 20; page++) {
        const res = await getPartnerReviews({ page, page_size: 100 });
        all.push(...res.results);
        if (!res.next) break;
    }
    return all;
};

interface ReportDef {
    key: string;
    icon: React.ElementType;
    tone: string;
    title: string;
    detail: string;
    scopeLabel: string;
    /** Omitted for a report this API can't generate yet — the row still renders, with a "Coming soon" pill instead of Download. */
    run?: () => Promise<{ filename: string; content: string }>;
}

export const ReportsPanel: React.FC<ReportsPanelProps> = ({ revenue }) => {
    const [downloading, setDownloading] = useState<string | null>(null);

    const reports: ReportDef[] = [
        {
            key: 'earnings',
            icon: FileText,
            tone: 'bg-tlb-amber-soft text-tlb-gold',
            title: 'Monthly earnings statement',
            detail: 'Bookings and earnings by month, from your revenue trend',
            scopeLabel: revenue?.period || 'current window',
            run: async () => ({
                filename: `tlb-earnings-${Date.now()}.csv`,
                content: buildEarningsStatementCsv(revenue?.revenue_trend || []),
            }),
        },
        {
            key: 'bookings',
            icon: BookOpen,
            tone: 'bg-tlb-blue-soft text-tlb-blue',
            title: 'Booking register',
            detail: 'Every booking with customer, amount and status',
            scopeLabel: 'all bookings',
            run: async () => ({ filename: `tlb-bookings-${Date.now()}.csv`, content: buildBookingsCsv(await getAllBookings()) }),
        },
        {
            key: 'enquiry-log',
            icon: MessageSquare,
            tone: 'bg-tlb-purple-soft text-tlb-purple',
            title: 'Enquiry & response log',
            detail: 'Reply times against SLA, per service and per team member',
            scopeLabel: 'last 90 days',
        },
        {
            key: 'gst',
            icon: FileSpreadsheet,
            tone: 'bg-tlb-green-soft text-tlb-green',
            title: 'GST summary (GSTR-ready)',
            detail: 'Taxable value, CGST/SGST and invoice numbers',
            scopeLabel: 'this quarter',
        },
        {
            key: 'reviews',
            icon: Star,
            tone: 'bg-tlb-red-soft text-tlb-red-deep',
            title: 'Reviews & ratings export',
            detail: 'Every review with listing, rating and comment',
            scopeLabel: 'all time',
            run: async () => ({ filename: `tlb-reviews-${Date.now()}.csv`, content: buildReviewsCsv(await fetchAllReviews()) }),
        },
    ];

    const handleDownload = async (report: ReportDef) => {
        if (!report.run) return;
        setDownloading(report.key);
        try {
            const { filename, content } = await report.run();
            downloadTextFile(filename, content);
        } catch (err: any) {
            toast.error(err?.message || `Couldn't build the ${report.title.toLowerCase()}. Please try again.`);
        } finally {
            setDownloading(null);
        }
    };

    return (
        <div className="flex flex-col">
            {reports.map(report => (
                <div key={report.key} className="grid grid-cols-[34px_1fr_auto_auto] gap-3.5 items-center py-3 border-t border-tlb-divider first:border-t-0">
                    <div className={`w-[34px] h-[34px] rounded-[11px] flex items-center justify-center flex-none ${report.tone}`}>
                        <report.icon size={16} strokeWidth={2.75} />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[13.5px] font-bold text-tlb-ink">{report.title}</p>
                        <p className="text-[12px] text-tlb-muted">{report.detail}</p>
                    </div>
                    <span className="text-[12.5px] text-tlb-muted whitespace-nowrap hidden sm:block">{report.scopeLabel}</span>
                    {report.run ? (
                        <button type="button" onClick={() => handleDownload(report)} disabled={downloading === report.key} className="pt-btn pt-btn-o flex-none">
                            {downloading === report.key ? <Loader2 size={14} className="animate-spin" /> : 'Download'}
                        </button>
                    ) : (
                        <Pill tone="neutral">Coming soon</Pill>
                    )}
                </div>
            ))}
        </div>
    );
};
