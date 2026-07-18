import { GridColDef, GridColumnVisibilityModel, GridSortModel } from '@mui/x-data-grid';
import { FieldValue, Timestamp } from 'firebase/firestore';
import { Donation } from '@/models/donation';
import { IUser } from '@/models/user';
import { OrgNameById } from './reportGridColumns';

export interface UserReportRow {
    id: string;
    displayName: string;
    email: string;
    phoneNumber: string;
    orgName: string;
    title: string;
    isDisabled: boolean;
    requestedCount: number;
    distributedCount: number;
    createdAt: Date | null;
    modifiedAt: Date | null;
}

function toDate(value: Timestamp | FieldValue | null | undefined): Date | null {
    if (value instanceof Timestamp) {
        try {
            return value.toDate();
        } catch {
            return null;
        }
    }
    return null;
}

// Counts come from the donations themselves rather than the user doc's requestedItems /
// distributedItems arrays: nothing in the app writes those, so they are empty or stale.
function countByUser(donations: Donation[]): Record<string, { requested: number; distributed: number }> {
    const counts: Record<string, { requested: number; distributed: number }> = {};
    const bump = (id: string | undefined, key: 'requested' | 'distributed') => {
        if (!id) return;
        counts[id] ??= { requested: 0, distributed: 0 };
        counts[id][key] += 1;
    };
    for (const donation of donations) {
        bump(donation.requestor?.id, 'requested');
        bump(donation.distributor?.id, 'distributed');
    }
    return counts;
}

export function buildUserRows(users: IUser[], orgNameById: OrgNameById = {}, donations: Donation[] = []): UserReportRow[] {
    const counts = countByUser(donations);
    // Some user docs are missing a uid field (the converter reads uid from doc data,
    // not the doc id); DataGrid throws on rows without an id, and such docs are empty anyway.
    return users.filter((user) => user.uid).map((user) => ({
        id: user.uid,
        displayName: user.displayName ?? '',
        email: user.email ?? '',
        phoneNumber: user.phoneNumber ?? '',
        orgName: user.organization ? (orgNameById[user.organization.id] ?? user.organization.name) : '',
        title: user.title ?? '',
        isDisabled: user.isDisabled ?? false,
        requestedCount: counts[user.uid]?.requested ?? 0,
        distributedCount: counts[user.uid]?.distributed ?? 0,
        createdAt: toDate(user.createdAt),
        modifiedAt: toDate(user.modifiedAt)
    }));
}

function formatDate(value: Date | null): string {
    return value ? value.toISOString().split('T')[0] : '';
}

const sinceGoLiveNote = 'Counted from donation records; only covers activity in this system since go-live (Nov 21 2025)';

export const userReportColumns: GridColDef<UserReportRow>[] = [
    {
        field: 'displayName',
        headerName: 'Name',
        width: 180,
        description: 'Shown name may be an email if the user never set a display name'
    },
    { field: 'email', headerName: 'Email', width: 220 },
    { field: 'phoneNumber', headerName: 'Phone', width: 140 },
    { field: 'orgName', headerName: 'Organization', width: 200 },
    { field: 'title', headerName: 'Title', width: 150 },
    {
        field: 'isDisabled',
        headerName: 'Status',
        width: 110,
        valueFormatter: (value: boolean) => (value ? 'Disabled' : 'Active')
    },
    { field: 'requestedCount', headerName: 'Items Requested', type: 'number', width: 140, description: sinceGoLiveNote },
    { field: 'distributedCount', headerName: 'Items Distributed', type: 'number', width: 145, description: sinceGoLiveNote },
    { field: 'createdAt', headerName: 'Account Created', type: 'date', width: 140, valueFormatter: formatDate },
    { field: 'modifiedAt', headerName: 'Last Modified', type: 'date', width: 140, valueFormatter: formatDate }
];

export const userVisibleColumns = ['displayName', 'email', 'phoneNumber', 'orgName', 'isDisabled', 'requestedCount', 'distributedCount'];

export const userSortModel: GridSortModel = [{ field: 'displayName', sort: 'asc' }];

export function buildUserColumnVisibilityModel(visibleColumns: string[]): GridColumnVisibilityModel {
    const model: GridColumnVisibilityModel = {};
    for (const col of userReportColumns) {
        model[col.field] = visibleColumns.includes(col.field);
    }
    return model;
}
