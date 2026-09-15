// ---------------------------------------------------------------------------
// Display formatters shared across the partner portal (money, counts, dates).
// Pure functions — keep them free of React so they stay trivially testable.
// ---------------------------------------------------------------------------

/** Parses API decimals ("24500.00", numbers, null) into a finite number. */
export const toNumber = (value: unknown): number => {
    const n = parseFloat(String(value ?? ''));
    return Number.isFinite(n) ? n : 0;
};

/** Rs 1,05,910 */
export const formatRupees = (amount: number): string =>
    `Rs ${Math.round(amount).toLocaleString('en-IN')}`;

/** Rs 1.05L · Rs 2.4Cr · Rs 62,400 — for headline figures. */
export const formatRupeesCompact = (amount: number): string => {
    const abs = Math.abs(amount);
    const short = (n: number) => String(parseFloat(n.toFixed(2)));
    if (abs >= 1e7) return `Rs ${short(amount / 1e7)}Cr`;
    if (abs >= 1e5) return `Rs ${short(amount / 1e5)}L`;
    return formatRupees(amount);
};

export const formatCount = (n: number): string => n.toLocaleString('en-IN');

export const parseDate = (value: unknown): Date | null => {
    if (value === null || value === undefined || value === '') return null;
    const d = new Date(String(value));
    return Number.isNaN(d.getTime()) ? null : d;
};

export const isSameLocalDay = (a: Date, b: Date): boolean =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/** "just now" · "12m ago" · "5h ago" · "3d ago" · "14 Aug" */
export const timeAgo = (value: unknown, now: Date = new Date()): string => {
    const d = parseDate(value);
    if (!d) return '';
    const s = Math.max(0, Math.floor((now.getTime() - d.getTime()) / 1000));
    if (s < 60) return 'just now';
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const days = Math.floor(h / 24);
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

/** "Aviraj Studio" → "AS" */
export const initialsOf = (name: string): string => {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    const letters = parts.length === 1 ? parts[0].slice(0, 2) : parts[0][0] + parts[1][0];
    return letters.toUpperCase();
};

/** ['Events', 'Classes', 'Venues'] → "Events, Classes & Venues" */
export const joinWithAmpersand = (items: string[]): string => {
    if (items.length <= 1) return items[0] ?? '';
    return `${items.slice(0, -1).join(', ')} & ${items[items.length - 1]}`;
};

const DAY_MS = 86_400_000;

/** True for a moment within 24h of `now` (covers "started earlier today" through "tomorrow, this time"). */
export const startsWithinADay = (startsAt: string | null, now: Date): boolean => {
    const starts = parseDate(startsAt);
    if (!starts) return false;
    const diffMs = starts.getTime() - now.getTime();
    return diffMs >= -DAY_MS && diffMs <= DAY_MS;
};

/** "Today 7:00pm" · "Tomorrow 4:00pm" · "Sat 15 Aug 7:00am" · "—" when unknown. */
export const slotLabelOf = (startsAt: string | null, now: Date): string => {
    const starts = parseDate(startsAt);
    if (!starts) return '—';
    const time = starts.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
    if (isSameLocalDay(starts, now)) return `Today ${time}`;
    const tomorrow = new Date(now); tomorrow.setDate(now.getDate() + 1);
    if (isSameLocalDay(starts, tomorrow)) return `Tomorrow ${time}`;
    const dateStr = starts.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
    return `${dateStr} ${time}`;
};
