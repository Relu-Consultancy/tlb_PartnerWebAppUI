import React, { useEffect, useState } from 'react';
import { EntityType, Screen } from '../../types';
import { usePartner } from '../../context/PartnerContext';
import { SkeletonDashboard } from '../../components/ui';
import { markNotificationRead, InAppNotification } from '../../api/notifications';
import { PartnerListing } from '../../api/portalSummary';
import { getDateRangeOption } from '../../constants/dateRange';
import { requestProfileSection } from '../../constants/profileSections';
import { joinWithAmpersand } from '../../utils/format';
import { AttentionAction } from './dashboardModel';
import { useDashboardData } from './useDashboardData';
import { KpiGrid } from './components/KpiGrid';
import { PerformanceCard, PerformanceModal } from './components/PerformanceCard';
import { RecentActivity } from './components/RecentActivity';
import { AttentionCard } from './components/AttentionCard';
import { ActivitySummary } from './components/ActivitySummary';
import { EventsSoonBanner } from './components/EventsSoonBanner';
import { ReviewNoteModal } from './components/ReviewNoteModal';

interface HomeProps {
  onNavigate: (screen: Screen) => void;
}

const LAYOUT = 'px-4 sm:px-[26px] pt-4 pb-6 grid content-start gap-x-[18px] gap-y-3.5 lg:grid-cols-[minmax(0,1.55fr)_minmax(320px,1fr)]';

export const Home: React.FC<HomeProps> = ({ onNavigate }) => {
  const { allowedEntities, setAllowedEntities, dateRange } = usePartner();
  const { loading, revenueLoading, partner, notifications, model, markActivityRead } = useDashboardData(allowedEntities, dateRange);
  const [perfOpen, setPerfOpen] = useState(false);
  const [reviewListing, setReviewListing] = useState<PartnerListing | null>(null);

  // The backend's categories are the source of truth for nav + route guards.
  useEffect(() => {
    const categories = partner?.categories;
    if (!Array.isArray(categories) || categories.length === 0) return;
    const names = categories.map((c: any) => c?.name || c) as EntityType[];
    if (names.join(',') !== allowedEntities.join(',')) setAllowedEntities(names);
  }, [partner]);

  // Unfinished onboarding belongs in the onboarding flow, not the dashboard.
  useEffect(() => {
    const status = partner?.status;
    if (status === 'otp_verified') onNavigate('PARTNER_CATEGORY');
    else if (status === 'category_selected') onNavigate('REGISTRATION');
  }, [partner?.status]);

  if (loading || !model) return <SkeletonDashboard />;

  const period = getDateRangeOption(dateRange);
  const periodLabel = dateRange === 'all' ? 'All time' : `Last ${period.label}`;
  const services = joinWithAmpersand(model.scope);

  const runAttentionAction = (action: AttentionAction) => {
    if (action.kind === 'screen') onNavigate(action.screen);
    else if (action.kind === 'profile') {
      requestProfileSection(action.section);
      onNavigate('BRAND_PROFILE');
    } else setReviewListing(action.listing);
  };

  const openActivity = (item: InAppNotification) => {
    if (!item.is_read) {
      markNotificationRead(item.id).catch(() => { /* non-fatal */ });
      markActivityRead(item.id);
    }
    if (item.action_url) window.open(item.action_url, '_blank', 'noopener,noreferrer');
    else onNavigate('MESSAGES');
  };

  return (
    <div className={LAYOUT}>
      <header className="lg:col-span-2">
        <h1 className="pt-h1">Dashboard</h1>
        <p className="text-[12.5px] text-tlb-sub mt-[5px]">
          {services ? `Everything across your ${services}` : 'Your partner overview'} · {period.phrase}
        </p>
      </header>

      <div className="min-w-0 flex flex-col gap-3.5">
        <KpiGrid kpis={model.kpis} revenueLoading={revenueLoading} />
        <PerformanceCard
          rows={model.performance}
          onOpenDetails={() => setPerfOpen(true)}
          onManageListings={() => onNavigate('SERVICE_LISTINGS')}
        />
        <RecentActivity items={notifications} onOpen={openActivity} onViewAll={() => onNavigate('MESSAGES')} />
      </div>

      <div className="min-w-0 flex flex-col gap-3.5">
        {model.eventsSoon.length > 0 && <EventsSoonBanner events={model.eventsSoon} />}
        <AttentionCard items={model.attention} onSelect={runAttentionAction} />
        <ActivitySummary lines={model.summary} periodLabel={period.phrase} />
      </div>

      <PerformanceModal
        open={perfOpen}
        onClose={() => setPerfOpen(false)}
        rows={model.performance}
        periodLabel={periodLabel}
        onOpenAnalytics={() => { setPerfOpen(false); onNavigate('ANALYTICS'); }}
      />
      <ReviewNoteModal
        listing={reviewListing}
        onClose={() => setReviewListing(null)}
        onOpenListings={() => { setReviewListing(null); onNavigate('SERVICE_LISTINGS'); }}
      />
    </div>
  );
};
