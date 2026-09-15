import React, { useEffect, useState } from 'react';
import { Menu, Plus } from 'lucide-react';
import { Screen } from '../types';
import { NotificationCenter } from './NotificationCenter';
import { EntityPickerSheet, createListingScreen } from './EntityPickerSheet';
import { AccountMenu, DateRangePicker } from './portal';
import { usePartner } from '../context/PartnerContext';
import { getExtendedProfile } from '../api/onboarding';
import { loadCurrentPartner, PARTNER_UPDATED_EVENT } from '../api/portalSummary';
import { requestProfileSection } from '../constants/profileSections';

interface TopHeaderProps {
    onOpenSidebar: () => void;
    onNavigate: (screen: Screen) => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({ onOpenSidebar, onNavigate }) => {
    const { allowedEntities } = usePartner();
    const [partner, setPartner] = useState<any>(null);
    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    const [pickerOpen, setPickerOpen] = useState(false);

    // Identity is decorative in the header, so failures fall back to placeholders.
    useEffect(() => {
        let cancelled = false;
        const loadIdentity = () => {
            loadCurrentPartner().then(p => { if (!cancelled) setPartner(p); }).catch(() => {});
            getExtendedProfile()
                .then(res => {
                    const ext = res?.data ?? res;
                    if (!cancelled) setLogoUrl(ext?.logo || ext?.logo_url || null);
                })
                .catch(() => {});
        };
        loadIdentity();
        window.addEventListener(PARTNER_UPDATED_EVENT, loadIdentity);
        return () => {
            cancelled = true;
            window.removeEventListener(PARTNER_UPDATED_EVENT, loadIdentity);
        };
    }, []);

    const createListing = () => {
        if (allowedEntities.length === 1) {
            onNavigate(createListingScreen(allowedEntities[0]));
        } else if (allowedEntities.length > 1) {
            setPickerOpen(true);
        } else {
            requestProfileSection('services');
            onNavigate('BRAND_PROFILE');
        }
    };

    return (
        <header className="sticky top-0 z-40 flex items-center gap-2 sm:gap-3 px-4 sm:px-[26px] py-[11px] bg-tlb-chrome border-b border-tlb-line">
            <button
                type="button"
                onClick={onOpenSidebar}
                aria-label="Open menu"
                className="lg:hidden -ml-1 p-2 rounded-[10px] text-tlb-ink hover:bg-tlb-hover transition-colors"
            >
                <Menu size={20} />
            </button>

            <DateRangePicker />

            <div className="flex-1" />

            <button
                type="button"
                onClick={createListing}
                aria-label="Create new listing"
                className="pt-btn pt-btn-y rounded-[10px] px-2.5 sm:px-[18px] py-[9px] text-[13px]"
            >
                <Plus size={16} strokeWidth={3} className="sm:hidden" />
                <span className="hidden sm:inline">+ Create new listing</span>
            </button>

            <NotificationCenter onNavigate={onNavigate} />

            <div className="hidden sm:block w-px h-[26px] bg-tlb-line flex-none" aria-hidden="true" />

            <AccountMenu partner={partner} entities={allowedEntities} logoUrl={logoUrl} onNavigate={onNavigate} />

            <EntityPickerSheet
                isOpen={pickerOpen}
                onClose={() => setPickerOpen(false)}
                allowedEntities={allowedEntities}
                onNavigate={onNavigate}
            />
        </header>
    );
};
