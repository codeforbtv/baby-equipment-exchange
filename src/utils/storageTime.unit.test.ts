/**
 * @jest-environment node
 */

import { Timestamp } from 'firebase/firestore';
import { Donation } from '@/models/donation';
import { daysInStorage, formatStorageLabel, agingTier, compareDonations, SortKey } from '@/utils/storageTime';

const NOW = new Date('2026-06-24T00:00:00.000Z');
const DAY = 86_400_000;

// Builds a minimal Donation-like object with only the fields the helper reads.
function makeDonation(fields: Partial<Donation>): Donation {
    return fields as Donation;
}

function tsDaysBeforeNow(days: number): Timestamp {
    return Timestamp.fromMillis(NOW.getTime() - days * DAY);
}

describe('daysInStorage', () => {
    test('available item counts firstReceivedAt → now', () => {
        const d = makeDonation({ status: 'available', firstReceivedAt: tsDaysBeforeNow(47) });
        expect(daysInStorage(d, NOW)).toBe(47);
    });

    test('reserved item counts live to now', () => {
        const d = makeDonation({ status: 'reserved', firstReceivedAt: tsDaysBeforeNow(12) });
        expect(daysInStorage(d, NOW)).toBe(12);
    });

    test('distributed item freezes at dateDistributed', () => {
        const d = makeDonation({
            status: 'distributed',
            firstReceivedAt: tsDaysBeforeNow(100),
            dateDistributed: tsDaysBeforeNow(70) // 30 days after receive
        });
        expect(daysInStorage(d, NOW)).toBe(30);
    });

    test('unavailable item freezes at modifiedAt', () => {
        const d = makeDonation({
            status: 'unavailable',
            firstReceivedAt: tsDaysBeforeNow(100),
            modifiedAt: tsDaysBeforeNow(60) // 40 days after receive
        });
        expect(daysInStorage(d, NOW)).toBe(40);
    });

    test('missing firstReceivedAt → null', () => {
        const d = makeDonation({ status: 'not-received', firstReceivedAt: null });
        expect(daysInStorage(d, NOW)).toBeNull();
    });

    test('negative span clamps to 0', () => {
        const d = makeDonation({ status: 'available', firstReceivedAt: tsDaysBeforeNow(-5) }); // start in future
        expect(daysInStorage(d, NOW)).toBe(0);
    });
});

describe('formatStorageLabel', () => {
    test('1 day singular', () => expect(formatStorageLabel(1)).toBe('1 day'));
    test('47 days plural', () => expect(formatStorageLabel(47)).toBe('47 days'));
    test('60 → 2 months', () => expect(formatStorageLabel(60)).toBe('2 months'));
    test('200 → 7 months', () => expect(formatStorageLabel(200)).toBe('7 months'));
    test('null → dash', () => expect(formatStorageLabel(null)).toBe('—'));
});

describe('agingTier boundaries', () => {
    test('29 fresh', () => expect(agingTier(29)).toBe('fresh'));
    test('30 warn', () => expect(agingTier(30)).toBe('warn'));
    test('89 warn', () => expect(agingTier(89)).toBe('warn'));
    test('90 aged', () => expect(agingTier(90)).toBe('aged'));
    test('179 aged', () => expect(agingTier(179)).toBe('aged'));
    test('180 stale', () => expect(agingTier(180)).toBe('stale'));
    test('null → null', () => expect(agingTier(null)).toBeNull());
});

describe('compareDonations — nulls always last', () => {
    const aged = makeDonation({ status: 'available', firstReceivedAt: tsDaysBeforeNow(100) });
    const fresh = makeDonation({ status: 'available', firstReceivedAt: tsDaysBeforeNow(5) });
    const none = makeDonation({ status: 'not-received', firstReceivedAt: null });

    function sortIds(sortBy: SortKey) {
        return [fresh, none, aged].slice().sort(compareDonations(sortBy, NOW));
    }

    test('storage-desc: aged first, null last', () => {
        expect(sortIds('storage-desc')).toEqual([aged, fresh, none]);
    });

    test('storage-asc: fresh first, null still last', () => {
        expect(sortIds('storage-asc')).toEqual([fresh, aged, none]);
    });
});
