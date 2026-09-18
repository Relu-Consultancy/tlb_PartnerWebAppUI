import React from 'react';
import { EntityType } from '../../../types';
import { StatsEnquiries, StatsEvents, StatsOverview, StatsVenues } from '../../../api/stats';
import { formatCount } from '../../../utils/format';

interface CustomersPanelProps {
    allowedEntities: EntityType[];
    overview: StatsOverview | null;
    events: StatsEvents | null;
    venues: StatsVenues | null;
    enquiries: StatsEnquiries | null;
}

const Stat: React.FC<{ label: string; value: string; sub?: string }> = ({ label, value, sub }) => (
    <div>
        <p className="pt-eyebrow">{label}</p>
        <p className="pt-num text-[19px] mt-1">{value}</p>
        {sub && <p className="text-[11.5px] text-tlb-muted mt-0.5">{sub}</p>}
    </div>
);

/** Whatever real customer-behaviour metrics exist for this partner's services — no fabricated cohort breakdown. */
export const CustomersPanel: React.FC<CustomersPanelProps> = ({ allowedEntities, overview, events, venues, enquiries }) => {
    const hasClassOrProgram = allowedEntities.includes('Classes') || allowedEntities.includes('Programs');
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-6">
            {overview && <Stat label="Profile views" value={formatCount(overview.profile_views)} sub={`${formatCount(overview.followers)} followers`} />}
            {enquiries?.avg_response_hours != null && <Stat label="Avg. response time" value={`${enquiries.avg_response_hours.toFixed(1)}h`} sub="to a new enquiry" />}
            {hasClassOrProgram && enquiries?.student_retention_pct != null && (
                <Stat label="Student retention" value={`${Math.round(enquiries.student_retention_pct)}%`} sub={`${formatCount(enquiries.monthly_enrolments)} enrolments this month`} />
            )}
            {hasClassOrProgram && enquiries?.trial_requests != null && <Stat label="Trial requests" value={formatCount(enquiries.trial_requests)} />}
            {allowedEntities.includes('Venues') && venues && (
                <Stat label="Repeat venue clients" value={formatCount(venues.repeat_clients)} sub={venues.avg_duration_minutes ? `${Math.round(venues.avg_duration_minutes / 60)}h avg. hire` : undefined} />
            )}
            {allowedEntities.includes('Venues') && venues?.occupancy_rate != null && <Stat label="Occupancy rate" value={`${Math.round(venues.occupancy_rate)}%`} />}
            {allowedEntities.includes('Events') && events?.engagement_rate != null && <Stat label="Engagement rate" value={`${Math.round(events.engagement_rate)}%`} />}
        </div>
    );
};
