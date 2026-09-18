import React, { useState } from 'react';
import { BookOpen, FileSpreadsheet, FileText, Loader2, MessageSquare, Star } from 'lucide-react';
import { Pill } from '../../../components/portal';
import { RevenuePeriod } from '../../../api/stats';
import {
    getEarningsStatementReport, getBookingRegisterReport, getEnquiryResponseLogReport, getReviewsExportReport,
    DownloadedReport,
} from '../../../api/reports';
import { toast } from '../../../components/ui';
import { downloadTextFile } from '../../../utils/download';
import { getDateRangeOption } from '../../../constants/dateRange';

interface ReportsPanelProps {
    period: RevenuePeriod;
}

interface ReportDef {
    key: string;
    icon: React.ElementType;
    tone: string;
    title: string;
    detail: string;
    /** Omitted for a report this API can't generate yet (GST summary) — the row still renders, with a "Coming soon" pill instead of Download. */
    run?: (period: RevenuePeriod) => Promise<DownloadedReport>;
}

const REPORTS: ReportDef[] = [
    {
        key: 'earnings',
        icon: FileText,
        tone: 'bg-tlb-amber-soft text-tlb-gold',
        title: 'Monthly earnings statement',
        detail: 'Gross amount, platform fee and net payable per payout',
        run: getEarningsStatementReport,
    },
    {
        key: 'bookings',
        icon: BookOpen,
        tone: 'bg-tlb-blue-soft text-tlb-blue',
        title: 'Booking register',
        detail: 'Every booking with customer, amount and status',
        run: getBookingRegisterReport,
    },
    {
        key: 'enquiry-log',
        icon: MessageSquare,
        tone: 'bg-tlb-purple-soft text-tlb-purple',
        title: 'Enquiry & response log',
        detail: 'Reply times against a 24h SLA, per enquiry',
        run: getEnquiryResponseLogReport,
    },
    {
        key: 'gst',
        icon: FileSpreadsheet,
        tone: 'bg-tlb-green-soft text-tlb-green',
        title: 'GST summary (GSTR-ready)',
        detail: 'Taxable value, CGST/SGST and invoice numbers',
    },
    {
        key: 'reviews',
        icon: Star,
        tone: 'bg-tlb-red-soft text-tlb-red-deep',
        title: 'Reviews & ratings export',
        detail: 'Every review with listing, rating and comment',
        run: getReviewsExportReport,
    },
];

export const ReportsPanel: React.FC<ReportsPanelProps> = ({ period }) => {
    const [downloading, setDownloading] = useState<string | null>(null);
    const periodLabel = getDateRangeOption(period).phrase;

    const handleDownload = async (report: ReportDef) => {
        if (!report.run) return;
        setDownloading(report.key);
        try {
            const { filename, content } = await report.run(period);
            downloadTextFile(filename, content);
        } catch (err: any) {
            toast.error(err?.message || `Couldn't build the ${report.title.toLowerCase()}. Please try again.`);
        } finally {
            setDownloading(null);
        }
    };

    return (
        <div className="flex flex-col">
            {REPORTS.map(report => (
                <div key={report.key} className="grid grid-cols-[34px_1fr_auto_auto] gap-3.5 items-center py-3 border-t border-tlb-divider first:border-t-0">
                    <div className={`w-[34px] h-[34px] rounded-[11px] flex items-center justify-center flex-none ${report.tone}`}>
                        <report.icon size={16} strokeWidth={2.75} />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[13.5px] font-bold text-tlb-ink">{report.title}</p>
                        <p className="text-[12px] text-tlb-muted">{report.detail}</p>
                    </div>
                    <span className="text-[12.5px] text-tlb-muted whitespace-nowrap hidden sm:block">
                        {report.run ? periodLabel : 'not available yet'}
                    </span>
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
