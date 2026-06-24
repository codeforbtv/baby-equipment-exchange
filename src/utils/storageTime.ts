import type { Donation } from '@/models/donation';

export type AgingTier = 'fresh' | 'warn' | 'aged' | 'stale';

// start = firstReceivedAt; end = distributed → dateDistributed; unavailable → modifiedAt; else now
export function daysInStorage(d: Donation, now = new Date()): number | null {
    const start = d.firstReceivedAt?.toDate();
    if (!start) return null;
    let end = now;
    if (d.status === 'distributed' && d.dateDistributed) end = d.dateDistributed.toDate();
    else if (d.status === 'unavailable' && d.modifiedAt) end = d.modifiedAt.toDate();
    const days = Math.floor((end.getTime() - start.getTime()) / 86_400_000);
    return Math.max(0, days);
}

export function isFrozen(d: Donation): boolean {
    return d.status === 'distributed' || d.status === 'unavailable';
}

export function formatStorageLabel(days: number | null): string {
    if (days === null) return '—';
    if (days < 60) return `${days} ${days === 1 ? 'day' : 'days'}`;
    return `${Math.round(days / 30)} months`;
}

export function agingTier(days: number | null): AgingTier | null {
    if (days === null) return null;
    if (days < 30) return 'fresh';
    if (days < 90) return 'warn';
    if (days < 180) return 'aged';
    return 'stale';
}

export type SortKey = 'storage-desc' | 'storage-asc' | 'accepted-desc' | 'accepted-asc';

// Returns a comparator. Storage nulls ("—") always sink last, regardless of direction.
export function compareDonations(sortBy: SortKey, now = new Date()): (a: Donation, b: Donation) => number {
    if (sortBy === 'storage-desc' || sortBy === 'storage-asc') {
        const dir = sortBy === 'storage-desc' ? -1 : 1;
        return (a, b) => {
            const da = daysInStorage(a, now);
            const db = daysInStorage(b, now);
            if (da === null && db === null) return 0;
            if (da === null) return 1;
            if (db === null) return -1;
            return (da - db) * dir;
        };
    }
    const dir = sortBy === 'accepted-desc' ? -1 : 1;
    return (a, b) => {
        const ta = (a.dateAccepted ?? a.createdAt)?.toMillis() ?? null;
        const tb = (b.dateAccepted ?? b.createdAt)?.toMillis() ?? null;
        if (ta === null && tb === null) return 0;
        if (ta === null) return 1;
        if (tb === null) return -1;
        return (ta - tb) * dir;
    };
}

export const TIER_COLOR: Record<AgingTier, string> = {
    fresh: '#4caf50', // success.light — distinct from #2e7d32 Available chip
    warn: '#ffb300', // amber (new hue, app has none)
    aged: '#ed6c02', // warning.main
    stale: '#d32f2f' // error.main
};
