import { TrafficPeriodKey } from '../../api/stats';

export interface TrafficPeriodOption { key: TrafficPeriodKey; label: string }

export const TRAFFIC_PERIOD_OPTIONS: TrafficPeriodOption[] = [
    { key: 'today', label: 'Today' },
    { key: 'yesterday', label: 'Yesterday' },
    { key: 'this_week', label: 'This week' },
    { key: 'last_week', label: 'Last week' },
    { key: 'this_month', label: 'This month' },
    { key: 'custom', label: 'Custom range' },
];

export const DEFAULT_TRAFFIC_PERIOD: TrafficPeriodKey = 'this_month';

/** "organic/direct" reads better title-cased; named sources (instagram, google…) as-is with a capital. */
export const sourceLabel = (source: string): string => {
    if (!source || source === 'organic/direct') return 'Organic / direct';
    return source.charAt(0).toUpperCase() + source.slice(1);
};
