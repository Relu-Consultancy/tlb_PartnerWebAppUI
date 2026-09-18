import React from 'react';
import { Check, ImageIcon } from 'lucide-react';
import { EntityType } from '../../../types';
import { countListings, PartnerListing } from '../../../api/portalSummary';
import {
    ENTITY_TONE, PartnerIdentity, Pill, serviceMixLabel, VERIFICATION_TONE,
} from '../../../components/portal';

interface ProfileSummaryCardProps {
    identity: PartnerIdentity;
    entities: EntityType[];
    listings: PartnerListing[];
    completion: number;
    rating: number | null;
    logoUrl: string | null;
    onLogoSelected: (file: File) => void;
    onManageServices: () => void;
}

const Stat: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div>
        <div className="pt-eyebrow">{label}</div>
        <div className="pt-num text-[19px] text-tlb-ink mt-1">{value}</div>
    </div>
);

export const ProfileSummaryCard: React.FC<ProfileSummaryCardProps> = ({
    identity, entities, listings, completion, rating, logoUrl, onLogoSelected, onManageServices,
}) => {
    const serviceMix = serviceMixLabel(entities);
    const meta = [
        identity.city,
        identity.memberSince && `partner since ${identity.memberSince}`,
        identity.code,
    ].filter(Boolean).join(' · ');

    return (
        <section className="pt-card px-5 sm:px-6 py-5 flex flex-col lg:flex-row lg:items-center gap-5 lg:gap-[22px]" aria-label="Profile summary">
            <div className="flex items-center gap-4 sm:gap-[22px] flex-1 min-w-0">
                <label className="relative flex-none cursor-pointer group rounded-full focus-within:ring-2 focus-within:ring-tlb-amber focus-within:ring-offset-2">
                    <span className="sr-only">Upload logo</span>
                    <span className="w-[68px] h-[68px] sm:w-[76px] sm:h-[76px] rounded-full overflow-hidden border border-dashed border-tlb-edge bg-tlb-wash flex flex-col items-center justify-center text-tlb-muted group-hover:border-tlb-amber transition-colors">
                        {logoUrl ? (
                            <img src={logoUrl} alt={`${identity.name} logo`} className="w-full h-full object-cover" />
                        ) : (
                            <>
                                <ImageIcon size={20} strokeWidth={2.25} />
                                <span className="text-[11px] font-medium mt-0.5">Logo</span>
                            </>
                        )}
                    </span>
                    {identity.verification === 'verified' && (
                        <span className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-tlb-green border-[3px] border-white flex items-center justify-center" aria-hidden="true">
                            <Check size={11} strokeWidth={4} className="text-white" />
                        </span>
                    )}
                    <input
                        type="file"
                        accept="image/png,image/jpeg"
                        className="sr-only"
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            const file = e.target.files?.[0];
                            if (file) onLogoSelected(file);
                            e.target.value = '';
                        }}
                    />
                </label>

                <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-[9px]">
                        <h2 className="pt-h2 break-words">{identity.name}</h2>
                        <Pill tone={VERIFICATION_TONE[identity.verification]} className="text-[11px] py-[3px]">{identity.verificationLabel}</Pill>
                        {serviceMix && <Pill tone="amber" className="text-[11px] py-[3px]">{serviceMix}</Pill>}
                    </div>
                    {meta && <p className="text-[12.5px] text-tlb-sub mt-[5px]">{meta}</p>}
                    <div className="flex flex-wrap items-center gap-[7px] mt-2.5">
                        {entities.map(entity => (
                            <Pill key={entity} tone={ENTITY_TONE[entity]} className="text-[11px] py-[3px]">
                                {entity} · {countListings(listings, entity).total}
                            </Pill>
                        ))}
                        <button type="button" onClick={onManageServices} className="pt-btn pt-btn-o px-[11px] py-[3px] text-[11px]">
                            Manage services
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex gap-[26px] flex-none border-t lg:border-t-0 lg:border-l border-tlb-divider pt-4 lg:pt-0 lg:pl-[26px]">
                <Stat label="Profile complete" value={`${completion}%`} />
                <Stat label="Rating" value={rating != null ? `${rating.toFixed(1)} ★` : '—'} />
            </div>
        </section>
    );
};
