import { TrafficGroupBy, TrafficPeriodKey } from '../../api/stats';

export type { TrafficGroupBy, TrafficPeriodKey };

/** Screen-local period selection — a custom range only carries real dates once both are picked. */
export interface TrafficPeriodState {
    key: TrafficPeriodKey;
    dateFrom: string;
    dateTo: string;
}

export interface TrendBar {
    date: string;
    label: string;
    views: number;
}

export interface SourceSlice {
    source: string;
    label: string;
    views: number;
    pct: number;
}
