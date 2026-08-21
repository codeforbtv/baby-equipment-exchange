/**
 * @jest-environment node
 */

import { Donation } from '@/models/donation';
import { buildRows, extractUniqueDonors, extractUniqueRequestors, OrgNameById, UserOrgLookup } from './reportGridColumns';

// Builds a minimal Donation-like object with only the fields buildRows reads.
function makeDonation(fields: Partial<Donation>): Donation {
    return {
        id: 'd1',
        brand: '',
        model: '',
        category: '',
        status: 'requested',
        donorName: '',
        donorEmail: '',
        bulkCollection: '',
        getDaysInStorage: () => undefined,
        ...fields
    } as Donation;
}

const lookup: UserOrgLookup = { 'uid-1': { id: 'org-1', name: 'CVOEO' } };
const orgNames: OrgNameById = { 'org-1': 'CVOEO', 'org-2': 'Snapshot Org' };

describe('buildRows org attribution precedence', () => {
    test('requestor snapshot wins over join and distributor string', () => {
        const d = makeDonation({
            requestor: { id: 'uid-1', name: 'A', email: 'a@x.org', organization: { id: 'org-2', name: 'Snapshot Org' } },
            distributor: { id: 'uid-1', name: 'A', email: 'a@x.org', organization: 'Legacy Org' }
        });
        const [row] = buildRows([d], {}, lookup);
        expect(row.requestorOrg).toBe('Snapshot Org');
        expect(row.orgName).toBe('Snapshot Org');
        expect(row.distributorOrg).toBe('Legacy Org');
    });

    test('falls back to user join when no snapshot', () => {
        const d = makeDonation({
            requestor: { id: 'uid-1', name: 'A', email: 'a@x.org' },
            distributor: null
        });
        const [row] = buildRows([d], {}, lookup);
        expect(row.requestorOrg).toBe('CVOEO');
        expect(row.orgName).toBe('CVOEO');
    });

    test('falls back to distributor string when requestor has no org', () => {
        const d = makeDonation({
            requestor: { id: 'uid-unknown', name: 'B', email: 'b@x.org' },
            distributor: { id: 'uid-unknown', name: 'B', email: 'b@x.org', organization: 'THE Janet S. Munt Family Room' }
        });
        const [row] = buildRows([d], {}, lookup);
        expect(row.requestorOrg).toBe('');
        expect(row.orgName).toBe('THE Janet S. Munt Family Room');
        expect(row.distributorOrg).toBe('THE Janet S. Munt Family Room');
    });

    test('blank when no requestor org and no distributor', () => {
        const d = makeDonation({ requestor: { id: 'uid-unknown', name: 'B', email: 'b@x.org' }, distributor: null });
        const [row] = buildRows([d], {}, lookup);
        expect(row.requestorOrg).toBe('');
        expect(row.orgName).toBe('');
    });

    test('no requestor at all stays blank and does not hit the lookup', () => {
        const d = makeDonation({ requestor: null, distributor: null });
        const [row] = buildRows([d], {}, lookup);
        expect(row.requestorOrg).toBe('');
        expect(row.orgName).toBe('');
    });

    test('explicit null snapshot means no org at request time — does not fall back to join', () => {
        const d = makeDonation({
            requestor: { id: 'uid-1', name: 'A', email: 'a@x.org', organization: null },
            distributor: null
        });
        const [row] = buildRows([d], {}, lookup);
        expect(row.requestorOrg).toBe('');
        expect(row.orgName).toBe('');
    });

    test('stale snapshot name is canonicalized by org id', () => {
        const d = makeDonation({
            requestor: { id: 'uid-1', name: 'A', email: 'a@x.org', organization: { id: 'org-1', name: 'THE CVOEO (old name)' } },
            distributor: null
        });
        const [row] = buildRows([d], {}, lookup, orgNames);
        expect(row.requestorOrg).toBe('CVOEO');
        expect(row.orgName).toBe('CVOEO');
    });

    test('snapshot org id missing from canonical list falls back to stored name', () => {
        const d = makeDonation({
            requestor: { id: 'uid-9', name: 'C', email: 'c@x.org', organization: { id: 'org-gone', name: 'Deleted Org' } },
            distributor: null
        });
        const [row] = buildRows([d], {}, lookup, orgNames);
        expect(row.requestorOrg).toBe('Deleted Org');
        expect(row.orgName).toBe('Deleted Org');
    });
});

describe('extractUniqueRequestors / extractUniqueDonors', () => {
    test('requestor with no name is returned with an empty name and does not break the sort', () => {
        const nameless = makeDonation({ requestor: { id: 'uid-1', email: 'a@x.org' } as Donation['requestor'] });
        const named = makeDonation({ requestor: { id: 'uid-2', name: 'Zoe', email: 'z@x.org' } });
        const requestors = extractUniqueRequestors([nameless, named]);
        expect(requestors).toEqual([
            { id: 'uid-1', name: '', email: 'a@x.org' },
            { id: 'uid-2', name: 'Zoe', email: 'z@x.org' }
        ]);
    });

    test('requestor with no email is returned with an empty email', () => {
        const d = makeDonation({ requestor: { id: 'uid-1', name: 'A' } as Donation['requestor'] });
        expect(extractUniqueRequestors([d])).toEqual([{ id: 'uid-1', name: 'A', email: '' }]);
    });

    test('donor with an email but no name is returned with an empty name', () => {
        const nameless = makeDonation({ donorName: undefined, donorEmail: 'd@x.org' });
        const named = makeDonation({ donorName: 'Zoe', donorEmail: 'z@x.org' });
        const donors = extractUniqueDonors([nameless, named]);
        expect(donors).toEqual([
            { name: '', email: 'd@x.org' },
            { name: 'Zoe', email: 'z@x.org' }
        ]);
    });

    test('donor with neither name nor email is skipped', () => {
        expect(extractUniqueDonors([makeDonation({ donorName: undefined, donorEmail: undefined })])).toEqual([]);
    });
});
