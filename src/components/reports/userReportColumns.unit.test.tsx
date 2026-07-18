/**
 * @jest-environment node
 */

import { IUser } from '@/models/user';
import { Donation } from '@/models/donation';
import { buildUserRows } from './userReportColumns';

function user(fields: Partial<IUser>): IUser {
    return {
        uid: 'u1',
        email: 'u@x.org',
        displayName: 'User One',
        phoneNumber: '',
        requestedItems: null,
        distributedItems: null,
        notes: null,
        organization: null,
        modifiedAt: null,
        ...fields
    } as unknown as IUser;
}

function donation(fields: Partial<Donation>): Donation {
    return { id: 'd', requestor: null, distributor: null, ...fields } as unknown as Donation;
}

describe('buildUserRows', () => {
    test('user with no donation activity counts 0', () => {
        const [row] = buildUserRows([user({ uid: 'u1' })], {}, []);
        expect(row.requestedCount).toBe(0);
        expect(row.distributedCount).toBe(0);
    });

    test('counts derive from donations, not the stale user-doc arrays', () => {
        const donations = [
            donation({ id: 'd1', requestor: { id: 'u1', name: 'A', email: 'a@x' } }),
            donation({ id: 'd2', requestor: { id: 'u1', name: 'A', email: 'a@x' } }),
            donation({
                id: 'd3',
                requestor: { id: 'u1', name: 'A', email: 'a@x' },
                distributor: { id: 'u1', name: 'A', email: 'a@x', organization: 'Org' }
            }),
            donation({ id: 'd4', requestor: { id: 'other', name: 'B', email: 'b@x' } })
        ];
        // The user doc claims counts that the app never maintains; they must be ignored.
        const [row] = buildUserRows([user({ uid: 'u1', requestedItems: [], distributedItems: null })], {}, donations);
        expect(row.requestedCount).toBe(3);
        expect(row.distributedCount).toBe(1);
    });

    test('distributed item still counts as requested by that user', () => {
        const donations = [
            donation({
                id: 'd1',
                requestor: { id: 'u1', name: 'A', email: 'a@x' },
                distributor: { id: 'u1', name: 'A', email: 'a@x', organization: 'Org' }
            })
        ];
        const [row] = buildUserRows([user({ uid: 'u1' })], {}, donations);
        expect(row.requestedCount).toBe(1);
        expect(row.distributedCount).toBe(1);
    });

    test('donations with no requestor or distributor are ignored', () => {
        const [row] = buildUserRows([user({ uid: 'u1' })], {}, [donation({ id: 'd1' })]);
        expect(row.requestedCount).toBe(0);
        expect(row.distributedCount).toBe(0);
    });

    test('user docs without a uid are dropped (DataGrid requires row ids)', () => {
        const rows = buildUserRows([user({ uid: undefined, displayName: '', email: '' }), user({ uid: 'u1' })]);
        expect(rows).toHaveLength(1);
        expect(rows[0].id).toBe('u1');
    });

    test('org name canonicalized by id, blank when no org', () => {
        const orgNames = { 'org-1': 'CVOEO' };
        const [withOrg, withoutOrg] = buildUserRows(
            [user({ uid: 'u1', organization: { id: 'org-1', name: 'THE CVOEO (stale)' } }), user({ uid: 'u2', organization: null })],
            orgNames
        );
        expect(withOrg.orgName).toBe('CVOEO');
        expect(withoutOrg.orgName).toBe('');
    });
});
