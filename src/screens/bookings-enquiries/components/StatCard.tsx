import React from 'react';

interface StatCardProps {
    label: string;
    value: string;
    valueClassName?: string;
    sub?: string;
}

/** One figure in a stat strip — shared by the Bookings and Refunds tabs. */
export const StatCard: React.FC<StatCardProps> = ({ label, value, valueClassName = '', sub }) => (
    <div className="pt-stat">
        <span className="pt-eyebrow">{label}</span>
        <div className={`pt-stat-n ${valueClassName}`}>{value}</div>
        {sub && <div className="text-[11.5px] text-tlb-muted mt-0.5">{sub}</div>}
    </div>
);
