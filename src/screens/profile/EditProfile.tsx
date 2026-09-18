import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Bell, Building2, CreditCard, Images, Loader2, ShieldCheck, Sparkles } from 'lucide-react';
import { EntityType, Screen } from '../../types';
import { usePartner } from '../../context/PartnerContext';
import { SkeletonProfile } from '../../components/ui';
import { createListingScreen } from '../../components/EntityPickerSheet';
import { describePartner, orderEntities } from '../../components/portal';
import { loadPartnerListings, PartnerListing } from '../../api/portalSummary';
import { getStatsReviews } from '../../api/stats';
import { getBankDetails } from '../../api/banking';
import {
    consumeProfileSection, PROFILE_SECTION_EVENT, ProfileSectionId,
} from '../../constants/profileSections';
import { useProfileForm } from './useProfileForm';
import { useVerticalsData } from './useVerticalsData';
import { ProfileSummaryCard } from './components/ProfileSummaryCard';
import { ProfileTab, ProfileTabs } from './components/ProfileTabs';
import { BusinessDetailsSection } from './components/BusinessDetailsSection';
import { MediaSection } from './components/MediaSection';
import { ServicesSection } from './components/ServicesSection';
import { BankSection, BankState, DocumentsSection } from './components/AccountSections';
import { NotificationPrefsSection } from './components/NotificationPrefsSection';

interface ProfileProps {
    onNavigate: (screen: Screen) => void;
}

export const BrandProfile: React.FC<ProfileProps> = ({ onNavigate }) => {
    const { allowedEntities, setAllowedEntities } = usePartner();
    const form = useProfileForm();
    const verticals = useVerticalsData(setAllowedEntities);
    const [editingDetails, setEditingDetails] = useState(false);
    const [listings, setListings] = useState<PartnerListing[]>([]);
    const [rating, setRating] = useState<number | null>(null);
    const [bankState, setBankState] = useState<BankState>({ status: 'loading' });
    const [activeSection, setActiveSection] = useState<ProfileSectionId>('business');
    const sectionEls = useRef<Partial<Record<ProfileSectionId, HTMLElement | null>>>({});

    const scopeKey = allowedEntities.join(',');
    useEffect(() => {
        loadPartnerListings(allowedEntities).then(setListings).catch(() => { /* counts fall back to 0 */ });
    }, [scopeKey]);

    const loadBank = useCallback(() => {
        setBankState({ status: 'loading' });
        getBankDetails()
            .then(bank => setBankState({ status: 'ready', bank }))
            .catch(() => setBankState({ status: 'error' }));
    }, []);

    useEffect(() => {
        getStatsReviews().then(r => setRating(r.avg_rating)).catch(() => { /* shown as — */ });
        loadBank();
    }, [loadBank]);

    const scrollToSection = useCallback((id: ProfileSectionId) => {
        setActiveSection(id);
        sectionEls.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, []);

    // Deep links from the account menu / dashboard — on arrival and while open.
    useEffect(() => {
        if (form.loading) return;
        const openRequested = () => {
            const id = consumeProfileSection();
            if (id) requestAnimationFrame(() => scrollToSection(id));
        };
        openRequested();
        window.addEventListener(PROFILE_SECTION_EVENT, openRequested);
        return () => window.removeEventListener(PROFILE_SECTION_EVENT, openRequested);
    }, [form.loading, scrollToSection]);

    // Highlight the tab for whichever section is at the top of the viewport.
    useEffect(() => {
        if (form.loading || typeof IntersectionObserver === 'undefined') return;
        const observer = new IntersectionObserver(entries => {
            const topmost = entries
                .filter(entry => entry.isIntersecting)
                .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
            const id = (topmost?.target as HTMLElement | undefined)?.dataset.section as ProfileSectionId | undefined;
            if (id) setActiveSection(id);
        }, { rootMargin: '-80px 0px -55% 0px' });
        (Object.values(sectionEls.current) as (HTMLElement | null | undefined)[])
            .forEach(el => { if (el) observer.observe(el); });
        return () => observer.disconnect();
    }, [form.loading]);

    if (form.loading) return <SkeletonProfile />;

    const identity = describePartner(form.partner);
    const entities = orderEntities(allowedEntities);
    const kyc = form.partner?.verification ?? form.partner ?? {};
    const bankNeedsAction = bankState.status === 'ready'
        && (bankState.bank === null || bankState.bank.verification_status === 'rejected');

    const tabs: ProfileTab[] = [
        { id: 'business', label: 'Business details', icon: Building2 },
        { id: 'media', label: 'Photos & media', icon: Images },
        { id: 'services', label: 'Services & categories', icon: Sparkles },
        { id: 'documents', label: 'Documents & KYC', icon: ShieldCheck, alert: identity.verification === 'pending' ? 1 : 0 },
        { id: 'bank', label: 'Bank & payouts', icon: CreditCard, alert: bankNeedsAction ? 1 : 0 },
        { id: 'notifications', label: 'Notifications', icon: Bell },
    ];

    const section = (id: ProfileSectionId, content: React.ReactNode) => (
        <section
            key={id}
            data-section={id}
            ref={(el: HTMLElement | null) => { sectionEls.current[id] = el; }}
            className="scroll-mt-20"
        >
            {content}
        </section>
    );

    const handleSave = async () => {
        if (await form.save()) setEditingDetails(false);
    };

    return (
        <div className="px-4 sm:px-[26px] pt-5 pb-9 flex flex-col gap-[18px]">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-6">
                <div>
                    <nav aria-label="Breadcrumb" className="text-xs text-tlb-muted mb-[5px]">
                        <button type="button" onClick={() => onNavigate('HOME')} className="text-tlb-link hover:text-tlb-gold transition-colors">
                            Dashboard
                        </button>
                        {' · '}My Profile
                    </nav>
                    <h1 className="pt-h2 text-[20px]">My profile</h1>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {form.dirty && !form.saving && (
                        <span role="status" className="text-[11.5px] font-semibold text-tlb-gold mr-1">Unsaved changes</span>
                    )}
                    <button type="button" className="pt-btn pt-btn-o" onClick={() => onNavigate('PREVIEW_PROFILE')}>
                        View public page
                    </button>
                    <button type="button" className="pt-btn pt-btn-y" onClick={handleSave} disabled={!form.dirty || form.saving}>
                        {form.saving && <Loader2 size={14} className="animate-spin" />}
                        {form.saving ? 'Saving…' : 'Save changes'}
                    </button>
                </div>
            </div>

            <ProfileSummaryCard
                identity={identity}
                entities={entities}
                listings={listings}
                completion={form.completion}
                rating={rating}
                logoUrl={form.logoUrl}
                onLogoSelected={form.selectLogo}
                onManageServices={() => scrollToSection('services')}
            />

            <div className="grid gap-5 items-start lg:grid-cols-[236px_minmax(0,1fr)]">
                <ProfileTabs tabs={tabs} active={activeSection} onSelect={scrollToSection} />

                <div className="flex flex-col gap-[18px] min-w-0">
                    {section('business', (
                        <BusinessDetailsSection
                            fields={form.fields}
                            editing={editingDetails}
                            onEdit={() => setEditingDetails(true)}
                            onCancel={() => { form.discardDetails(); setEditingDetails(false); }}
                            onChange={form.setField}
                            email={identity.email}
                            gstin={kyc.gst_number || null}
                            pan={kyc.pan_number || null}
                            verified={identity.verification === 'verified'}
                        />
                    ))}
                    {section('media', (
                        <MediaSection
                            coverUrl={form.coverUrl}
                            onCoverSelected={form.selectCover}
                            images={form.images}
                            video={form.video}
                            uploading={form.uploadingMedia}
                            onAddImages={form.addImages}
                            onAddVideo={form.addVideo}
                            onDelete={form.deleteMedia}
                        />
                    ))}
                    {section('services', (
                        <ServicesSection
                            listings={listings}
                            verticals={verticals.verticals}
                            verticalsLoading={verticals.loading}
                            verticalsAvailable={verticals.available}
                            busyCategory={verticals.busy}
                            onViewListings={() => onNavigate('SERVICE_LISTINGS')}
                            onCreateListing={(entity: EntityType) => onNavigate(createListingScreen(entity))}
                            onAddVertical={verticals.add}
                            onRemoveVertical={verticals.remove}
                        />
                    ))}
                    {section('documents', <DocumentsSection identity={identity} onManage={() => onNavigate('DOCUMENTS')} />)}
                    {section('bank', <BankSection state={bankState} onManage={() => onNavigate('FINANCIAL_HUB')} onRetry={loadBank} />)}
                    {section('notifications', <NotificationPrefsSection />)}
                </div>
            </div>
        </div>
    );
};
