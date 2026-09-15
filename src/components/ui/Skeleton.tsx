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
//   SkeletonDashboard title + KPI pairs + service table + side cards (inside portal shell)
//   SkeletonProfile   title row + summary card + tabs + sections (inside portal shell)
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

/** Dashboard-shaped skeleton (portal shell supplies the top bar): title, KPI pairs, service table, side cards. */
export const SkeletonDashboard: React.FC = () => (
  <div
    className="px-4 sm:px-[26px] pt-4 pb-6 grid content-start gap-x-[18px] gap-y-3.5 lg:grid-cols-[minmax(0,1.55fr)_minmax(320px,1fr)]"
    aria-busy="true"
    aria-label="Loading dashboard"
  >
    <div className="lg:col-span-2 space-y-2">
      <Skeleton className="h-7 w-40" />
      <Skeleton className="h-3.5 w-72 max-w-full" />
    </div>
    <div className="flex flex-col gap-3.5">
      <div className="grid grid-cols-2 gap-2.5">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[92px] rounded-[14px]" />)}
      </div>
      <Skeleton className="h-60 rounded-[14px]" />
      <Skeleton className="h-44 rounded-[14px]" />
    </div>
    <div className="flex flex-col gap-3.5">
      <Skeleton className="h-80 rounded-[14px]" />
      <Skeleton className="h-52 rounded-[14px]" />
    </div>
  </div>
);

/** My Profile-shaped skeleton (portal shell supplies the top bar): title row, summary card, tabs + sections. */
export const SkeletonProfile: React.FC = () => (
  <div className="px-4 sm:px-[26px] pt-5 pb-9 flex flex-col gap-[18px]" aria-busy="true" aria-label="Loading profile">
    <div className="flex items-end justify-between gap-4">
      <div className="space-y-2">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-6 w-40" />
      </div>
      <Skeleton className="h-9 w-48 rounded-full hidden sm:block" />
    </div>
    <Skeleton className="h-[140px] rounded-[14px]" />
    <div className="grid gap-5 lg:grid-cols-[236px_minmax(0,1fr)]">
      <Skeleton className="h-72 rounded-[14px] hidden lg:block" />
      <div className="flex flex-col gap-[18px]">
        <Skeleton className="h-80 rounded-[14px]" />
        <Skeleton className="h-64 rounded-[14px]" />
      </div>
    </div>
  </div>
);
