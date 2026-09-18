import { CouponStatus } from './types';
import { Tone } from '../../components/portal';

export const COUPON_STATUS_META: Record<CouponStatus, { label: string; tone: Tone }> = {
    active: { label: 'Active', tone: 'green' },
    scheduled: { label: 'Scheduled', tone: 'amber' },
    ended: { label: 'Ended', tone: 'neutral' },
    paused: { label: 'Paused', tone: 'neutral' },
};

export const COUPON_STATUS_ORDER: CouponStatus[] = ['active', 'scheduled', 'ended', 'paused'];

export const LISTING_TYPE_OPTIONS: { key: string; label: string }[] = [
    { key: 'event', label: 'Events' },
    { key: 'class', label: 'Classes' },
    { key: 'program', label: 'Programs' },
    { key: 'venue', label: 'Venues' },
];

export const GENDER_OPTIONS: { key: 'male' | 'female' | 'other'; label: string }[] = [
    { key: 'male', label: 'Men' },
    { key: 'female', label: 'Women' },
    { key: 'other', label: 'Other' },
];
