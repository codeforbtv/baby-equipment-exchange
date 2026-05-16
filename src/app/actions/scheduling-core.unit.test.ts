/**
 * @jest-environment node
 */

import type { Invitee, ScheduledEventWithInvitees } from 'scheduling';
import { matchDonationBookings, nameSimilarity, normalizeEmail } from './scheduling-core';

function invitee(overrides: Partial<Invitee>): Invitee {
    return {
        uri: 'mock://event/1/invitees/1',
        name: 'Avery Bennett',
        email: 'avery.bennett@example.test',
        first_name: 'Avery',
        last_name: 'Bennett',
        status: 'active',
        created_at: '2026-05-16T12:00:00Z',
        updated_at: '2026-05-16T12:00:00Z',
        cancel_url: 'https://example.test/cancel',
        reschedule_url: 'https://example.test/reschedule',
        ...overrides
    };
}

function event(invitees: Invitee[]): ScheduledEventWithInvitees {
    return {
        uri: 'mock://event/1',
        name: 'BEE Donation Drop-Off',
        status: 'active',
        start_time: '2026-05-20T14:00:00Z',
        end_time: '2026-05-20T14:30:00Z',
        event_type: 'mock://event-types/dropoff',
        location: null,
        invitees_counter: { total: invitees.length, active: invitees.length, limit: invitees.length },
        created_at: '2026-05-16T12:00:00Z',
        updated_at: '2026-05-16T12:00:00Z',
        event_memberships: [],
        calendar_event: null,
        invitees
    };
}

describe('scheduling matching', () => {
    it('normalizes email aliases conservatively', () => {
        expect(normalizeEmail('Avery.Bennett+bee@gmail.com')).toBe('averybennett@gmail.com');
        expect(normalizeEmail('avery.bennett+bee@example.test')).toBe('avery.bennett@example.test');
    });

    it('scores exact and reversed names without accepting lone first names', () => {
        expect(nameSimilarity('Avery Bennett', 'Bennett, Avery')).toBeGreaterThanOrEqual(0.86);
        expect(nameSimilarity('Avery Carter', 'Avery Bennett')).toBeLessThan(0.72);
    });

    it('confirms an exact email match', () => {
        const [result] = matchDonationBookings(
            [{
                id: 'donation-1',
                donorEmail: 'avery.bennett@example.test',
                donorName: 'Avery Bennett',
                status: 'pending delivery'
            }],
            [event([invitee({})])],
            'dropoff'
        );

        expect(result.confidence).toBe('confirmed');
        expect(result.matchedInvitee?.email).toBe('avery.bennett@example.test');
    });

    it('promotes tag plus strong name matches to confirmed', () => {
        const [result] = matchDonationBookings(
            [{
                id: 'donation-2',
                donorEmail: 'different@example.test',
                donorName: 'Avery Bennett',
                tagNumber: 'BEE-1234',
                status: 'pending delivery'
            }],
            [event([invitee({
                email: 'avery@other.test',
                questions_and_answers: [{
                    position: 0,
                    question: 'Reference tag numbers',
                    answer: 'BEE-1234'
                }]
            })])],
            'dropoff'
        );

        expect(result.confidence).toBe('confirmed');
        expect(result.matchReason).toContain('Reference tag');
    });

    it('leaves weak matches unconfirmed', () => {
        const [result] = matchDonationBookings(
            [{
                id: 'donation-3',
                donorEmail: 'casey@example.test',
                donorName: 'Casey Jones',
                status: 'pending delivery'
            }],
            [event([invitee({ name: 'Avery Bennett', email: 'avery@example.test' })])],
            'dropoff'
        );

        expect(result.confidence).toBe('unconfirmed');
        expect(result.matchedInvitee).toBeUndefined();
    });
});
