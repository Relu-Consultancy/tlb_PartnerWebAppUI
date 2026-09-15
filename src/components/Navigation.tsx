import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { EntityType, Screen } from '../types';
import { usePartner } from '../context/PartnerContext';
import { loadPartnerListings, loadPartnerEnquiries, loadCouponCount, isUnanswered } from '../api/portalSummary';
import { CountBadge } from './portal';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
}

interface NavCounts {
  listings: number | null;
  unansweredEnquiries: number;
  coupons: number | null;
}

type NavEntry =
  | { kind: 'link'; label: string; screen: Screen; activeOn: Screen[]; alert?: number; count?: number | null }
  | { kind: 'soon'; label: string };

// Badge counts refresh as the partner moves around; portalSummary memoises the
// underlying reads, so this stays cheap and shares calls with the Dashboard.
const useNavCounts = (entities: EntityType[], currentScreen: Screen): NavCounts => {
  const [counts, setCounts] = useState<NavCounts>({ listings: null, unansweredEnquiries: 0, coupons: null });
  const scopeKey = entities.join(',');

  useEffect(() => {
    let cancelled = false;
    Promise.allSettled([loadPartnerListings(entities), loadPartnerEnquiries(entities), loadCouponCount()])
      .then(([listings, enquiries, coupons]) => {
        if (cancelled) return;
        setCounts({
          listings: listings.status === 'fulfilled' ? listings.value.length : null,
          unansweredEnquiries: enquiries.status === 'fulfilled' ? enquiries.value.filter(isUnanswered).length : 0,
          coupons: coupons.status === 'fulfilled' ? coupons.value : null,
        });
      });
    return () => { cancelled = true; };
  }, [scopeKey, currentScreen]);

  return counts;
};

const Brand: React.FC = () => (
  <div className="flex items-center gap-[11px] px-2 pb-[22px]">
    <div className="w-9 h-9 rounded-[10px] bg-tlb-amber text-tlb-dark flex items-center justify-center flex-none text-[13px] font-extrabold tracking-[-0.03em]">
      tlb
    </div>
    <span className="text-[17px] font-bold tracking-[-0.02em] text-tlb-ink">TLB partner</span>
  </div>
);

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, currentScreen, onNavigate }) => {
  const { allowedEntities } = usePartner();
  const counts = useNavCounts(allowedEntities, currentScreen);

  const entries: NavEntry[] = [
    { kind: 'link', label: 'Dashboard', screen: 'HOME', activeOn: ['HOME'] },
    {
      kind: 'link', label: 'Bookings/Enquiries', screen: 'BOOKINGS_ENQUIRIES',
      activeOn: ['BOOKINGS_ENQUIRIES', 'BOOKINGS', 'ENQUIRIES', 'ATTENDEES'], alert: counts.unansweredEnquiries,
    },
    { kind: 'link', label: 'My listings', screen: 'SERVICE_LISTINGS', activeOn: ['SERVICE_LISTINGS'], count: counts.listings },
    { kind: 'link', label: 'Coupons', screen: 'ALL_COUPONS', activeOn: ['ALL_COUPONS', 'CREATE_COUPON'], count: counts.coupons },
    { kind: 'link', label: 'Analytics', screen: 'ANALYTICS', activeOn: ['ANALYTICS'] },
    { kind: 'link', label: 'Revenue & payouts', screen: 'FINANCIAL_HUB', activeOn: ['FINANCIAL_HUB'] },
    { kind: 'link', label: 'Reviews', screen: 'REVIEWS', activeOn: ['REVIEWS'] },
    { kind: 'soon', label: 'Packages' },
    { kind: 'soon', label: 'Connections' },
  ];

  const handleNav = (screen: Screen) => {
    onNavigate(screen);
    onClose();
  };

  const renderEntry = (entry: NavEntry) => {
    if (entry.kind === 'soon') {
      return (
        <button key={entry.label} type="button" disabled className="pt-nav-item">
          <span className="pt-dot" />
          {entry.label}
          <span className="ml-auto text-[10px] font-medium text-tlb-muted">Coming soon</span>
        </button>
      );
    }
    const active = entry.activeOn.includes(currentScreen);
    return (
      <button
        key={entry.label}
        type="button"
        onClick={() => handleNav(entry.screen)}
        className={`pt-nav-item ${active ? 'is-active' : ''}`}
        aria-current={active ? 'page' : undefined}
      >
        <span className="pt-dot" />
        {entry.label}
        {entry.alert
          ? <CountBadge count={entry.alert} small className="ml-auto" label={`${entry.alert} unanswered`} />
          : entry.count != null && <span className="ml-auto pt-num text-[11px] font-medium text-tlb-muted">{entry.count}</span>}
      </button>
    );
  };

  const sidebarContent = (
    <div className="flex flex-col h-full w-full bg-tlb-chrome border-r border-tlb-line px-3.5 pt-[22px] pb-[18px]">
      <div className="flex items-start justify-between">
        <Brand />
        <button type="button" onClick={onClose} aria-label="Close menu" className="lg:hidden p-1.5 -mr-1 rounded-lg text-tlb-muted hover:bg-tlb-hover">
          <X size={18} />
        </button>
      </div>
      <nav aria-label="Main" className="flex-1 overflow-y-auto flex flex-col gap-0.5">
        {entries.map(renderEntry)}
      </nav>
    </div>
  );

  return (
    <>
      {/* Desktop: fixed sidebar */}
      <aside className="hidden lg:flex fixed top-0 left-0 bottom-0 w-[220px] z-40">
        {sidebarContent}
      </aside>

      {/* Mobile: animated drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-[rgba(20,19,18,0.45)] z-40 lg:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-[260px] z-50 lg:hidden"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
