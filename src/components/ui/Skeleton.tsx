import React from 'react';

// ---------------------------------------------------------------------------
// Skeleton loaders — pure client-side placeholders shown while the same data
// fetches you already make are in flight. Zero network / zero server impact;
// they only change what's painted during loading. Uses Tailwind `animate-pulse`
// (CSS-only, no JS timers).
//
// Each exported skeleton mirrors the LAYOUT of the screen it stands in for, so
// content doesn't jump when the real data arrives:
//   SkeletonPage      generic (route Suspense fallback / unknown destination)
//   SkeletonDashboard hero + profile card + KPI strip + widgets + quick actions
//   SkeletonListings  header + stat-chips + responsive card grid
//   SkeletonProfile   cover + avatar + bio + detail rows
//   SkeletonList      compact stacked rows (inline / wizard sections)
// ---------------------------------------------------------------------------

/** Base shimmer block — size/shape via className. */
export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse rounded-md bg-gray-200/70 ${className}`} />
);

/** Sticky-header placeholder shared by the full-page skeletons. */
const SkelHeader: React.FC = () => (
  <div className="bg-white px-6 md:px-8 py-4 border-b border-gray-100 flex items-center justify-between">
    <div className="flex items-center gap-4">
      <Skeleton className="w-9 h-9 rounded-xl" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
    <div className="flex items-center gap-2">
      <Skeleton className="h-9 w-24 rounded-xl hidden md:block" />
      <Skeleton className="w-9 h-9 rounded-full" />
    </div>
  </div>
);

/** Compact stack of list rows — for inline/section loading (e.g. wizard steps). */
export const SkeletonList: React.FC<{ rows?: number; className?: string }> = ({ rows = 4, className = '' }) => (
  <div className={`space-y-3 ${className}`}>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
        <Skeleton className="w-11 h-11 rounded-xl shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3.5 w-1/2" />
          <Skeleton className="h-3 w-1/3" />
        </div>
        <Skeleton className="w-16 h-6 rounded-lg shrink-0" />
      </div>
    ))}
  </div>
);

/** One listing-card placeholder — mirrors the cover-banner card in ServiceListings. */
export const SkeletonCard: React.FC = () => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
    <Skeleton className="h-28 w-full rounded-none" />
    <div className="p-4 flex flex-col gap-2">
      <Skeleton className="h-3.5 w-2/3" />
      <Skeleton className="h-3 w-1/3" />
      <div className="flex items-center justify-end gap-1.5 mt-3 pt-3 border-t border-gray-50">
        <Skeleton className="w-8 h-8 rounded-lg" />
        <Skeleton className="w-8 h-8 rounded-lg" />
        <Skeleton className="w-8 h-8 rounded-lg" />
      </div>
    </div>
  </div>
);

/**
 * Generic full-page skeleton (sticky header + hero + KPI strip + panels).
 * Used for route Suspense fallbacks where the destination screen isn't known yet.
 */
export const SkeletonPage: React.FC<{ withHeader?: boolean }> = ({ withHeader = true }) => (
  <div className="min-h-screen bg-gray-50">
    {withHeader && <SkelHeader />}
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Skeleton className="lg:col-span-2 h-40 rounded-3xl" />
        <Skeleton className="h-40 rounded-3xl" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    </div>
  </div>
);

/** Dashboard-shaped skeleton: hero + profile card, KPI strip, two widgets, quick actions. */
export const SkeletonDashboard: React.FC = () => (
  <div className="min-h-screen bg-[#F8FAFC]">
    <SkelHeader />
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
      {/* Hero */}
      <Skeleton className="h-40 rounded-2xl bg-slate-800" />
      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-[120px] rounded-2xl" />)}
      </div>
      {/* Revenue + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Skeleton className="lg:col-span-2 h-[420px] rounded-2xl" />
        <Skeleton className="h-[420px] rounded-2xl" />
      </div>
      {/* Offering Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
      </div>
      {/* Bottom widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Skeleton className="h-96 rounded-2xl" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    </div>
  </div>
);

/** Listings-shaped skeleton: header + stat-chips + responsive card grid. */
export const SkeletonListings: React.FC<{ cards?: number }> = ({ cards = 6 }) => (
  <div className="min-h-screen bg-gray-50">
    <SkelHeader />
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* stat-chip quick filters */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-2xl" />)}
      </div>
      {/* card grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: cards }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    </div>
  </div>
);

/** Profile-shaped skeleton: cover banner + overlapping avatar + bio + detail rows. */
export const SkeletonProfile: React.FC = () => (
  <div className="min-h-screen bg-gray-50">
    <SkelHeader />
    <div className="px-4 sm:px-6 py-6 max-w-3xl mx-auto space-y-6">
      <div className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm">
        <Skeleton className="h-36 w-full rounded-none" />
        <div className="px-6 pb-6">
          <Skeleton className="w-16 h-16 rounded-2xl -mt-8 border-4 border-white relative z-10" />
          <Skeleton className="h-5 w-1/2 mt-3" />
          <Skeleton className="h-3 w-full mt-3" />
          <Skeleton className="h-3 w-4/5 mt-2" />
        </div>
      </div>
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-2xl" />)}
      </div>
    </div>
  </div>
);
