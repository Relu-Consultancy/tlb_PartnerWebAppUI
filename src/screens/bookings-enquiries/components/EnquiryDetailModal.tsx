import React from 'react';
import { Check, Lock, MessageCircle, Phone, StickyNote } from 'lucide-react';
import { EnquiryStatus } from '../../../types';
import { Pill, PortalModal } from '../../../components/portal';
import { timeAgo } from '../../../utils/format';
import { EnquiryEntry } from '../types';
import { ENQUIRY_ENTITY_LABEL, ENQUIRY_ENTITY_TONE, ENQUIRY_STATUS_META, ENQUIRY_STATUS_OPTIONS } from '../presentation';

const MODEL_NOTE: Record<EnquiryEntry['entity'], string> = {
    Classes: 'Class enquiry — places are not sold upfront. Reply with availability, then confirm the place yourself.',
    Programs: 'Program enquiry — enrolment is not sold upfront. Reply with availability, then confirm enrolment yourself.',
    Venues: 'Venue enquiry — a custom hire quote. Short hourly slots are paid at checkout and appear under Bookings instead.',
};

interface EnquiryDetailModalProps {
    entry: EnquiryEntry | null;
    onClose: () => void;
    onUpdateStatus: (entry: EnquiryEntry, status: EnquiryStatus) => void;
    onUpdateNotes: (entry: EnquiryEntry, notes: string) => void;
    onUnlock: (entry: EnquiryEntry) => void;
}

export const EnquiryDetailModal: React.FC<EnquiryDetailModalProps> = ({ entry, onClose, onUpdateStatus, onUpdateNotes, onUnlock }) => {
    if (!entry) return <PortalModal open={false} onClose={onClose} title="" widthClass="max-w-[640px]"><div /></PortalModal>;

    return (
        <PortalModal
            open={!!entry}
            onClose={onClose}
            title={entry.name}
            widthClass="max-w-[640px]"
        >
            <div className="flex flex-wrap items-center gap-2 -mt-1 mb-1">
                <Pill tone={ENQUIRY_ENTITY_TONE[entry.entity]}>{ENQUIRY_ENTITY_LABEL[entry.entity]}</Pill>
                <Pill tone={ENQUIRY_STATUS_META[entry.status].tone}>{ENQUIRY_STATUS_META[entry.status].label}</Pill>
            </div>
            <div className="flex flex-wrap items-center gap-2 mb-4 text-[12.5px] text-tlb-sub">
                <span className="pt-eyebrow">Enquiry</span>
                <span className="pt-code">ENQ-{entry.id}</span>
                <span>{entry.listingTitle}</span>
            </div>

            <div className="pt-note mb-4">{MODEL_NOTE[entry.entity]}</div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 pb-4 border-b border-tlb-divider">
                <div>
                    <p className="pt-eyebrow mb-1">Received</p>
                    <p className="text-[13px] font-semibold text-tlb-ink">{timeAgo(entry.createdAt) || '—'}</p>
                </div>
                {entry.detail && (
                    <div>
                        <p className="pt-eyebrow mb-1">Detail</p>
                        <p className="text-[13px] font-semibold text-tlb-ink">{entry.detail}</p>
                    </div>
                )}
                <div>
                    <p className="pt-eyebrow mb-1">Contact</p>
                    <p className="text-[13px] font-semibold text-tlb-ink">{entry.isUnlocked ? 'Unlocked' : 'Locked'}</p>
                </div>
            </div>

            {entry.message && (
                <div className="mt-4">
                    <p className="pt-eyebrow mb-2">Message</p>
                    <p className="bg-tlb-wash rounded-xl rounded-tl-sm px-3.5 py-3 text-[13px] leading-relaxed text-tlb-body max-w-[88%]">{entry.message}</p>
                </div>
            )}

            <div className="mt-4">
                <label htmlFor="enquiry-notes" className="pt-eyebrow mb-2 flex items-center gap-1.5">
                    <StickyNote size={12} /> Internal notes
                </label>
                <textarea
                    id="enquiry-notes"
                    className="pt-input w-full min-h-[88px]"
                    placeholder="Add a note — e.g. called on 12th, will come for a trial next week"
                    defaultValue={entry.notes}
                    onBlur={(e: React.FocusEvent<HTMLTextAreaElement>) => {
                        if (e.target.value !== entry.notes) onUpdateNotes(entry, e.target.value);
                    }}
                />
            </div>

            <div className="mt-4">
                <p className="pt-eyebrow mb-2">Status</p>
                <div className="grid grid-cols-2 gap-2">
                    {ENQUIRY_STATUS_OPTIONS[entry.entity].map(status => {
                        const active = entry.status === status;
                        const meta = ENQUIRY_STATUS_META[status];
                        return (
                            <button
                                key={status}
                                type="button"
                                onClick={() => onUpdateStatus(entry, status)}
                                className={`pt-btn pt-btn-sm justify-start ${active ? '' : 'pt-btn-o'}`}
                                style={active ? { background: 'var(--color-tlb-ink)', color: '#fff' } : undefined}
                            >
                                {active && <Check size={12} strokeWidth={3} />}
                                {meta.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="mt-5 pt-4 border-t border-tlb-divider">
                {entry.isUnlocked ? (
                    <div className="flex flex-col sm:flex-row gap-2.5">
                        <span className="pt-field-v is-locked flex-1">{entry.contact}</span>
                        <a href={`tel:${entry.contact}`} className="pt-btn pt-btn-d">
                            <Phone size={14} /> Call customer
                        </a>
                        <a href={`https://wa.me/91${entry.contact.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="pt-btn pt-btn-o">
                            <MessageCircle size={14} /> WhatsApp
                        </a>
                    </div>
                ) : (
                    <button type="button" onClick={() => onUnlock(entry)} className="pt-btn pt-btn-y w-full">
                        <Lock size={14} /> Unlock contact info
                    </button>
                )}
            </div>
        </PortalModal>
    );
};
