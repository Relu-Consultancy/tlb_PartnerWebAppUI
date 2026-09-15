import React from 'react';
import { formatCount } from '../../../utils/format';
import { CouponStats, rupees } from '../model';

interface StatsStripProps {
    stats: CouponStats;
}

// Three real, computable tiles — the mock's other two ("Bookings driven at
// full price" and "Commission charged on") need each redemption's underlying
// booking amount, which coupon usage records don't carry, so they're dropped
// rather than approximated.
export const StatsStrip: React.FC<StatsStripProps> = ({ stats }) => (
    <div className="pt-card grid grid-cols-1 sm:grid-cols-3 overflow-hidden">
        <div className="pt-stat">
            <p className="pt-eyebrow">Coupons redeemed</p>
            <p className="pt-stat-n">{formatCount(stats.redeemed)}</p>
            <p className="text-[11.5px] text-tlb-muted mt-0.5">across {formatCount(stats.activeCount)} active coupons</p>
        </div>
        <div className="pt-stat">
            <p className="pt-eyebrow">Discount you gave</p>
            <p className="pt-stat-n text-tlb-red-deep">{rupees(stats.discountGiven)}</p>
            <p className="text-[11.5px] text-tlb-muted mt-0.5">out of your share, all time</p>
        </div>
        <div className="pt-stat">
            <p className="pt-eyebrow">Active coupons</p>
            <p className="pt-stat-n text-tlb-gold">{formatCount(stats.activeCount)}</p>
            <p className="text-[11.5px] text-tlb-muted mt-0.5">live right now</p>
        </div>
    </div>
);
