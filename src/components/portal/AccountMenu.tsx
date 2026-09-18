import React, { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronDown } from 'lucide-react';
import { EntityType, Screen } from '../../types';
import { useDismiss } from '../../hooks/useDismiss';
import { ProfileSectionId, requestProfileSection } from '../../constants/profileSections';
import { initialsOf } from '../../utils/format';
import { CountBadge, Pill } from './primitives';
import { describePartner, serviceMixLabel, VERIFICATION_TONE } from './partnerMeta';

interface AccountMenuProps {
    /** Raw `/partner/me/` payload; null while loading. */
    partner: any;
    entities: EntityType[];
    logoUrl: string | null;
    onNavigate: (screen: Screen) => void;
}

interface MenuItem {
    label: string;
    onSelect: () => void;
    alert?: number;
}

/** Top-bar account chip + dropdown (profile shortcuts, support, log out). */
export const AccountMenu: React.FC<AccountMenuProps> = ({ partner, entities, logoUrl, onNavigate }) => {
    const [open, setOpen] = useState(false);
    const rootRef = useRef<HTMLDivElement>(null);
    useDismiss(rootRef, open, () => setOpen(false));

    const identity = describePartner(partner);
    const serviceMix = serviceMixLabel(entities);
    const chipMeta = [identity.code, identity.verificationLabel].filter(Boolean).join(' · ');

    const go = (screen: Screen) => { setOpen(false); onNavigate(screen); };
    const openSection = (section: ProfileSectionId) => {
        setOpen(false);
        requestProfileSection(section);
        onNavigate('BRAND_PROFILE');
    };

    const items: MenuItem[] = [
        { label: 'My profile', onSelect: () => openSection('business') },
        { label: 'Business details', onSelect: () => openSection('business') },
        { label: 'Documents & KYC', onSelect: () => go('DOCUMENTS'), alert: identity.verification === 'pending' ? 1 : 0 },
        { label: 'Followers', onSelect: () => go('FOLLOWERS') },
        { label: 'Bank & payouts', onSelect: () => openSection('bank') },
        { label: 'Notification settings', onSelect: () => openSection('notifications') },
        { label: 'Help & support', onSelect: () => go('HELP_SUPPORT') },
    ];

    return (
        <div ref={rootRef} className="relative flex-none">
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                aria-haspopup="menu"
                aria-expanded={open}
                aria-label="Account menu"
                className="flex items-center gap-[9px] rounded-xl p-1 -m-1 hover:bg-tlb-hover/70 transition-colors"
            >
                <span className="w-[34px] h-[34px] rounded-full bg-tlb-amber-soft border border-tlb-amber-line flex items-center justify-center text-[11.5px] font-extrabold text-tlb-gold overflow-hidden flex-none">
                    {logoUrl
                        ? <img src={logoUrl} alt="" className="w-full h-full object-cover" />
                        : initialsOf(identity.name)}
                </span>
                <span className="hidden md:block text-left min-w-0 max-w-[180px]">
                    <span className="block text-[12.5px] font-bold leading-tight text-tlb-ink truncate">{identity.name}</span>
                    <span className="block text-[11px] leading-tight text-tlb-muted truncate">{chipMeta}</span>
                </span>
                <ChevronDown size={13} strokeWidth={3} className="hidden md:block text-tlb-muted" />
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        role="menu"
                        aria-label="Account"
                        className="pt-popover absolute right-0 top-12 z-50 w-[250px] overflow-hidden"
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.12 }}
                    >
                        <div className="px-4 py-3.5 border-b border-tlb-divider">
                            <p className="text-[13.5px] font-bold text-tlb-ink truncate">{identity.name}</p>
                            {(identity.email || identity.phone) && (
                                <p className="text-[11.5px] text-tlb-muted mt-0.5 truncate">{identity.email || identity.phone}</p>
                            )}
                            <div className="flex flex-wrap gap-1.5 mt-[9px]">
                                <Pill tone={VERIFICATION_TONE[identity.verification]}>{identity.verificationLabel}</Pill>
                                {serviceMix && <Pill tone="amber">{serviceMix}</Pill>}
                            </div>
                        </div>
                        <div className="p-1.5">
                            {items.map(item => (
                                <button key={item.label} type="button" role="menuitem" className="pt-nav-item" onClick={item.onSelect}>
                                    <span className="pt-dot" />
                                    {item.label}
                                    {!!item.alert && <CountBadge count={item.alert} small className="ml-auto" />}
                                </button>
                            ))}
                        </div>
                        <div className="p-1.5 border-t border-tlb-divider">
                            <button type="button" role="menuitem" className="pt-nav-item is-danger" onClick={() => go('LANDING')}>
                                <span className="pt-dot" />
                                Log out
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
