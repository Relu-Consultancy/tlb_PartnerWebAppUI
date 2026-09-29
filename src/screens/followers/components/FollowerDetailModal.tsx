import React from 'react';
import { Loader2, Mail, Phone } from 'lucide-react';
import { Pill, PortalModal } from '../../../components/portal';
import { FollowerDetail } from '../../../api/followers';
import { formatCount, timeAgo } from '../../../utils/format';
import { loyaltyLabel } from '../model';
import { genderLabel } from '../presentation';
import { FollowerRow } from '../types';
import { FollowerAvatar } from './FollowersTable';

interface FollowerDetailModalProps {
    /** The row that was clicked — keeps the modal titled while the detail loads. */
    row: FollowerRow | null;
    detail: FollowerDetail | null;
    loading: boolean;
    error: string | null;
    onClose: () => void;
}

const fmtDate = (iso: string | null): string => {
    if (!iso) return '—';
    try {
        return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
        return '—';
    }
};

const Field: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div>
        <p className="pt-eyebrow mb-1">{label}</p>
        <p className="text-[13px] font-semibold text-tlb-ink">{value}</p>
    </div>
);

export const FollowerDetailModal: React.FC<FollowerDetailModalProps> = ({ row, detail, loading, error, onClose }) => {
    if (!row)
        return (
            <PortalModal open={false} onClose={onClose} title="">
                <div />
            </PortalModal>
        );

    const loyalty = detail ? loyaltyLabel(detail.engagement.bookings_with_you) : null;

    return (
        <PortalModal open onClose={onClose} title={row.full_name} widthClass="max-w-[560px]">
            <div className="flex items-center gap-3.5 -mt-1 mb-4">
                <FollowerAvatar name={row.full_name} size="lg" />
                <div className="min-w-0 flex flex-wrap items-center gap-2">
                    {row.city && <Pill tone="neutral">{row.city}</Pill>}
                    {genderLabel(row.gender) && <Pill tone="neutral">{genderLabel(row.gender)}</Pill>}
                    {detail?.age != null && <Pill tone="neutral">{detail.age} years</Pill>}
                    {loyalty && <Pill tone="amber">{loyalty}</Pill>}
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-10 text-tlb-muted" aria-busy="true">
                    <Loader2 size={20} className="animate-spin" />
                </div>
            ) : error ? (
                <div className="pt-note bg-tlb-red-soft text-tlb-red-deep">{error}</div>
            ) : detail ? (
                <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 pb-4 border-b border-tlb-divider">
                        <Field label="Following since" value={fmtDate(detail.followed_at)} />
                        <Field label="Bookings with you" value={formatCount(detail.engagement.bookings_with_you)} />
                        <Field
                            label="Last booking"
                            value={detail.engagement.last_booking_at ? timeAgo(detail.engagement.last_booking_at) || '—' : 'None yet'}
                        />
                    </div>

                    <div className="mt-4">
                        <p className="pt-eyebrow mb-2">Contact</p>
                        {detail.email || detail.phone ? (
                            <div className="flex flex-wrap gap-2.5">
                                {detail.phone && (
                                    <a href={`tel:${detail.phone}`} className="pt-btn pt-btn-d">
                                        <Phone size={14} /> {detail.phone}
                                    </a>
                                )}
                                {detail.email && (
                                    <a href={`mailto:${detail.email}`} className="pt-btn pt-btn-o">
                                        <Mail size={14} /> {detail.email}
                                    </a>
                                )}
                            </div>
                        ) : (
                            <p className="pt-note">This follower hasn’t shared contact details with partners.</p>
                        )}
                    </div>
                </>
            ) : null}
        </PortalModal>
    );
};
